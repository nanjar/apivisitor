import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Staging table NATIVE untuk pesan chat baru dari exhibitor app.
 * pushed_at NULL = belum diproses push-job ke MySQL (events_chat).
 * Baca gabungan riwayat chat (GET chat room) HARUS union dari
 * events_chat (mirror, history lama) + tabel ini (pesan baru, belum
 * ke-push) supaya realtime tanpa nunggu push-job jalan.
 */
@Entity('exhibitor_app_chat_message')
export class ExhibitorChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'events_id', type: 'int' })
  eventsId: number;

  @Column({ name: 'chat_id', type: 'int' })
  chatId: number;

  @Column({ name: 'sender_exhibitor_id', type: 'int' })
  senderExhibitorId: number;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'pushed_at', type: 'timestamptz', nullable: true })
  pushedAt: Date | null;
}
