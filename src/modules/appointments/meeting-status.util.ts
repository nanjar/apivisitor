import { I18nService } from 'nestjs-i18n';

/**
 * Mapping kode approval_status di events_meeting_v2 ke label yang enak
 * dibaca visitor, sekarang di-translate via i18n (id/en) — dipakai bareng
 * oleh HomeService (upcoming appointment widget) & AppointmentsService
 * (Appointment List) supaya satu sumber kebenaran, gak ada 2 tempat yang
 * bisa saling drift.
 *
 * Kode yang belum ada terjemahannya akan tampil apa adanya (raw code) di
 * response — bukan error, tapi kurang ramah buat UI. Tambahin key baru di
 * src/i18n/{id,en}/messages.json -> appointmentStatus begitu ketemu kode baru.
 */
const KNOWN_STATUS_CODES = ['PE', 'AP', 'RJ', 'CL', 'CO', 'RS'];

export function mapMeetingApprovalStatus(i18n: I18nService, code: string): string {
  if (!KNOWN_STATUS_CODES.includes(code)) return code;
  return i18n.t(`messages.appointmentStatus.${code}`);
}
