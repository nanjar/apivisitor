import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { EventChat } from './entities/event-chat.entity';
import { EventChatMember } from './entities/event-chat-member.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(EventChat) private readonly chatRepo: Repository<EventChat>,
    @InjectRepository(EventChatMember)
    private readonly chatMemberRepo: Repository<EventChatMember>,
    @InjectRepository(ChatMessage) private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    private readonly i18n: I18nService,
    private readonly pushNotifications: PushNotificationsService,
    private readonly webhookService: WebhookService,
  ) {}

  // Screen: Chat List
  async listRooms(eventsId: number, guestsId: number) {
    const memberships = await this.chatMemberRepo.find({
      where: { eventsId, guestsId },
    });
    if (!memberships.length) return [];

    const chatIds = memberships.map((m) => m.chatId);
    const rooms = await this.chatRepo
      .createQueryBuilder('c')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.chatId IN (:...chatIds)', { chatIds })
      .orderBy('c.lastUpdate', 'DESC')
      .getMany();

    const unreadByChat = new Map(memberships.map((m) => [m.chatId, m.unread ?? 0]));

    // `events_chat.chat_name` di data legacy ternyata bukan nama yang
    // manusiawi (string encoded internal sistem lama), jadi kita resolve
    // nama tampilan dari company lawan chat (member lain di room yang
    // punya company_id) via events_chatmember_v2 -> exhibitor_company.
    const otherMembers = await this.chatMemberRepo
      .createQueryBuilder('m')
      .where('m.eventsId = :eventsId', { eventsId })
      .andWhere('m.chatId IN (:...chatIds)', { chatIds })
      .andWhere('m.guestsId != :guestsId', { guestsId })
      .getMany();
    const companyIdByChat = new Map(
      otherMembers.filter((m) => m.companyId != null).map((m) => [m.chatId, m.companyId as number]),
    );
    const companyIds = [...new Set(companyIdByChat.values())];
    const companies = companyIds.length
      ? await this.companyRepo
          .createQueryBuilder('c')
          .where('c.eventsId = :eventsId', { eventsId })
          .andWhere('c.id IN (:...ids)', { ids: companyIds })
          .getMany()
      : [];
    const companyNameById = new Map(companies.map((c) => [c.id, c.companyName]));

    return rooms.map((room) => {
      const companyId = companyIdByChat.get(room.chatId);
      const displayName =
        (companyId != null ? companyNameById.get(companyId) : null) ?? room.chatName;

      return {
        chatId: room.chatId,
        chatName: displayName,
        companyId: companyId ?? null,
        lastSender: room.lastSender,
        lastMessage: room.lastMessage,
        lastUpdate: room.lastUpdate,
        unreadCount: unreadByChat.get(room.chatId) ?? 0,
      };
    });
  }

  // Screen: Chat Room (history + kirim pesan)
  async getMessages(eventsId: number, guestsId: number, chatId: number) {
    await this.assertMember(eventsId, guestsId, chatId);

    return this.messageRepo.find({
      where: { eventsId, chatId },
      order: { createdAt: 'ASC' },
      take: 200,
    });
  }

  async sendMessage(
    eventsId: number,
    guestsId: number,
    chatId: number,
    senderName: string,
    text: string,
  ) {
    const membership = await this.assertMember(eventsId, guestsId, chatId);

    return this.messageRepo.manager.transaction(async (manager) => {
      const message = manager.getRepository(ChatMessage).create({
        eventsId,
        chatId,
        senderMemberId: membership.memberId,
        senderName,
        senderType: 'VI',
        message: text,
        isRead: false,
      });
      await manager.getRepository(ChatMessage).save(message);

      // Update snapshot di events_chat supaya Chat List tetap konsisten
      // dengan sistem lama (last message preview, totalPost, last_update).
      await manager.getRepository(EventChat).update(
        { eventsId, chatId },
        {
          lastSender: senderName,
          lastMessage: text,
          lastUpdate: new Date(),
          totalPost: () => 'COALESCE("totalPost", 0) + 1',
        } as any,
      );

      // Tambah unread counter untuk member lain di room ini (mis. exhibitor PIC)
      await manager
        .createQueryBuilder()
        .update(EventChatMember)
        .set({ unread: () => 'COALESCE(unread, 0) + 1' } as any)
        .where('eventsId = :eventsId AND chatId = :chatId AND guestsId != :guestsId', {
          eventsId,
          chatId,
          guestsId,
        })
        .execute();

      return message;
    }).then(async (message) => {
      // Push notification ke member VISITOR lain di room (jarang tapi bisa
      // ada skenario visitor-to-visitor). Fire-and-forget.
      const otherMembers = await this.chatMemberRepo.find({
        where: { eventsId, chatId },
      });
      const otherVisitorMembers = otherMembers.filter(
        (m) => m.usertypeId === 'VI' && m.guestsId !== guestsId,
      );
      await Promise.all(
        otherVisitorMembers.map((r) =>
          this.pushNotifications.notifyGuest(eventsId, r.guestsId, {
            title: senderName,
            body: text,
            data: { type: 'chat', chatId: String(chatId) },
          }),
        ),
      );

      // Member EXHIBITOR (PIC) di room ini gak bisa di-push langsung dari
      // sini (device token PIC dikelola sistem Exhibitor, bukan di sini) —
      // solusi transisi: kirim webhook, biar sistem Exhibitor yang notify
      // PIC-nya sendiri. Fire-and-forget, gagal kirim webhook TIDAK
      // gagalin pengiriman chat (pesannya udah tersimpan duluan di atas).
      const exhibitorMembers = otherMembers.filter((m) => m.usertypeId === 'EX');
      await Promise.all(
        exhibitorMembers.map((r) =>
          this.webhookService.notifyNewChatMessage({
            eventsId,
            chatId,
            companyId: r.companyId,
            recipientMemberId: r.memberId,
            senderGuestsId: guestsId,
            senderName,
            message: text,
            sentAt: message.createdAt.toISOString(),
          }),
        ),
      );

      return message;
    });
  }

  private async assertMember(eventsId: number, guestsId: number, chatId: number) {
    const membership = await this.chatMemberRepo.findOne({
      where: { eventsId, chatId, guestsId },
    });
    if (!membership) {
      throw new NotFoundException(this.i18n.t('messages.errors.chatRoomNotFound'));
    }
    return membership;
  }
}
