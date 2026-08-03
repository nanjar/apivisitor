import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { OllamaService, OllamaUnavailableError, ChatMessage } from './ollama.service';
import { AssistantChatDto } from './dto/assistant-chat.dto';

const LANGUAGE_NAMES: Record<string, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
};

@Injectable()
export class AssistantService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    private readonly ollama: OllamaService,
    private readonly i18n: I18nService,
  ) {}

  // Screen: AI Assistant
  async chat(eventsId: number, dto: AssistantChatDto) {
    const lastUserMessage = [...dto.messages].reverse().find((m) => m.role === 'user');

    const [event, relevantCompanies] = await Promise.all([
      this.eventRepo.findOne({ where: { id: eventsId } }),
      lastUserMessage ? this.findRelevantCompanies(eventsId, lastUserMessage.content) : Promise.resolve([]),
    ]);

    // Bahasa jawaban ngikutin resolusi i18n request ini (header x-lang /
    // ?lang= / Accept-Language), sama seperti bahasa pesan error lainnya —
    // jadi visitor cuma perlu set 1 preferensi bahasa buat seluruh app,
    // termasuk balasan AI Assistant.
    const lang = I18nContext.current()?.lang ?? 'id';
    const systemPrompt = this.buildSystemPrompt(event, relevantCompanies, lang);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...dto.messages.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    ];

    try {
      const reply = await this.ollama.chat(messages);
      return { reply, contextCompanies: relevantCompanies.map((c) => c.id) };
    } catch (err) {
      if (err instanceof OllamaUnavailableError) {
        // Jangan bocorin error teknis ke visitor — kasih pesan ramah dan
        // status code yang jelas nunjukin ini masalah layanan AI, bukan
        // salah request visitor.
        throw new ServiceUnavailableException(
          this.i18n.t('messages.errors.aiAssistantUnavailable'),
        );
      }
      throw err;
    }
  }

  private buildSystemPrompt(
    event: Event | null,
    companies: ExhibitorCompany[],
    lang: string,
  ): string {
    const eventInfo = event
      ? `Nama event: ${event.eventName}. Venue: ${event.venueName ?? '-'}, ${event.address ?? '-'}.`
      : 'Info event tidak tersedia.';

    const companyContext = companies.length
      ? `Beberapa exhibitor yang mungkin relevan dengan pertanyaan visitor:\n${companies
          .map((c) => `- ${c.companyName}${c.details ? `: ${c.details.slice(0, 150)}` : ''}`)
          .join('\n')}`
      : '';

    const languageName = LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES.id;

    return `Kamu adalah asisten AI untuk aplikasi visitor pameran/exhibition "Undangin Visitor".
${eventInfo}
Jawab pertanyaan visitor seputar event ini (jadwal, exhibitor, produk, lokasi booth) dengan singkat
dan ramah. WAJIB jawab dalam ${languageName}, terlepas dari bahasa yang dipakai visitor bertanya —
ini adalah preferensi bahasa yang sudah diset visitor di aplikasi.
${companyContext}
Kalau kamu tidak tahu jawabannya, katakan terus terang — jangan mengarang informasi.`;
  }

  private async findRelevantCompanies(eventsId: number, message: string): Promise<ExhibitorCompany[]> {
    // RAG sederhana: ambil kata-kata >3 huruf dari pesan user, cari company
    // yang namanya cocok. Bukan semantic search — cukup buat kasih Ollama
    // konteks nyata dari database supaya jawabannya gak ngarang, tanpa
    // perlu vector DB/embedding (di luar scope MVP ini).
    const words = message
      .split(/\s+/)
      .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter((w) => w.length > 3);
    if (!words.length) return [];

    const qb = this.companyRepo
      .createQueryBuilder('c')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.approvalStatus = :status', { status: 'AP' })
      .andWhere(
        words.map((_, i) => `c.companyName ILIKE :w${i}`).join(' OR '),
        Object.fromEntries(words.map((w, i) => [`w${i}`, `%${w}%`])),
      )
      .take(5);

    return qb.getMany();
  }
}
