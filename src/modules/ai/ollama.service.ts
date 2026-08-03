import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Dilempar kalau Ollama gak bisa dihubungi / timeout / balikin response
 * yang gak valid. Caller (service lain) HARUS catch ini dan fallback ke
 * behavior non-AI (mis. plain keyword search) — jangan biarin bocor jadi
 * 500 ke visitor cuma karena server Ollama lagi down/lambat.
 */
export class OllamaUnavailableError extends Error {}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL')!.replace(/\/$/, '');
    this.model = this.configService.get<string>('OLLAMA_MODEL')!;
    this.timeoutMs = this.configService.get<number>('OLLAMA_TIMEOUT_MS')!;
  }

  /**
   * Chat biasa, balikin teks jawaban asisten.
   *
   * `think: false` sengaja di-disable — qwen3:8b punya "thinking" capability
   * yang defaultnya nyisipin reasoning chain sebelum jawaban final (field
   * `message.thinking` terpisah dari `message.content`, dikonfirmasi dari
   * testing manual 30 Jul 2026). Buat use case kita (jawaban singkat ke
   * visitor) itu cuma nambah latency tanpa manfaat — 1 request simple aja
   * makan ~19 detik. Kalau butuh reasoning yang lebih dalam nanti, bisa
   * dibikin opsional per-call.
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    const data = await this.callOllama('/api/chat', {
      model: this.model,
      messages,
      stream: false,
      think: false,
    });
    const content = data?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new OllamaUnavailableError('Ollama returned empty response');
    }
    // Jaga-jaga: kalau suatu saat think:false gak didukung/diabaikan dan
    // model tetap nyisipin <think>...</think> di dalam content (beberapa
    // versi/model reasoning lain kadang begitu), tetap dibersihkan.
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return cleaned || content;
  }

  /**
   * Minta Ollama balikin JSON terstruktur. Karena model lokal (apalagi 8B)
   * kadang nyisipin teks pembuka/penutup atau ```json fences meski udah
   * diinstruksikan, kita strip itu sebelum JSON.parse. Kalau tetep gagal
   * parse, lempar OllamaUnavailableError supaya caller fallback.
   */
  async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const raw = await this.chat([
      { role: 'system', content: `${systemPrompt}\n\nPENTING: Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown fence.` },
      { role: 'user', content: userPrompt },
    ]);

    // Qwen3 (reasoning model) defaultnya suka nyisipin blok <think>...</think>
    // berisi proses berpikirnya sebelum jawaban final — buang dulu sebelum
    // parsing, atau JSON.parse pasti gagal karena ada teks non-JSON duluan.
    const withoutThinking = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const cleaned = withoutThinking
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Ambil substring dari '{' atau '[' pertama sampai '}'/']' terakhir,
    // jaga-jaga kalau model masih nyelipin kalimat pembuka/penutup.
    const start = cleaned.search(/[{[]/);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    const candidate = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;

    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      this.logger.warn(`Gagal parse JSON dari Ollama: ${(err as Error).message}. Raw: ${raw.slice(0, 200)}`);
      throw new OllamaUnavailableError('Ollama returned unparsable JSON');
    }
  }

  private async callOllama(path: string, body: unknown): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new OllamaUnavailableError(`Ollama HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (err instanceof OllamaUnavailableError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Ollama request gagal: ${message}`);
      throw new OllamaUnavailableError(message);
    } finally {
      clearTimeout(timeout);
    }
  }
}
