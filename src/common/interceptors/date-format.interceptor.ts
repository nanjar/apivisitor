import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ASUMSI: timezone tampilan = Asia/Jakarta (WIB), TERLEPAS dari timezone OS
// server (bisa aja server-nya di-set UTC). Kalau ternyata event-nya lintas
// timezone (WITA/WIT) atau butuh timezone visitor sendiri, kasih tau —
// perlu desain ulang (timezone gak bisa fix 1 nilai buat semua orang).
const DISPLAY_TIMEZONE = 'Asia/Jakarta';

function formatDateOnly(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')}`;
}

function formatDateTime(date: Date): string {
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => timeParts.find((p) => p.type === type)?.value ?? '';
  // Jam "24" dari Intl kadang muncul buat tengah malam (harusnya "00") —
  // dirapikan biar konsisten format 24 jam standar.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${formatDateOnly(date)} ${hour}:${get('minute')}:${get('second')}`;
}

/**
 * Format SEMUA field ber-tipe Date di response API secara otomatis,
 * rekursif ke seluruh nested object/array — jadi gak perlu ubah manual di
 * puluhan DTO/service satu-satu.
 *
 * Aturan penentuan date-only vs full-datetime murni dari NAMA FIELD:
 *   - Nama field diakhiri persis "Date" (mis. startDate, endDate,
 *     agendaDate) -> format dd/mm/yyyy
 *   - Selain itu (startDatetime, createdAt, updatedAt, viewedAt,
 *     checkinDatetime, lastUpdate, dst) -> format dd/mm/yyyy H:i:s
 *
 * PENTING: heuristik ini berbasis PENAMAAN, bukan tipe data. Kalau nanti
 * nambah field baru yang isinya Date, ikutin konvensi ini (akhiran persis
 * "Date" = date-only) biar ke-format otomatis dengan benar.
 */
@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transform(null, data)));
  }

  private transform(key: string | null, value: unknown): unknown {
    if (value instanceof Date) {
      return key && key.endsWith('Date') ? formatDateOnly(value) : formatDateTime(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.transform(null, item));
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.transform(k, v);
      }
      return result;
    }
    return value;
  }
}
