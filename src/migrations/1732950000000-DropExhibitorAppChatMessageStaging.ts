import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop exhibitor_app_chat_message - dibuat di migration
 * CreateExhibitorAppActionStagingTables (1732920000000), tapi ternyata
 * TIDAK diperlukan.
 *
 * Alasan (temuan Sept 2026): visitor app SUDAH punya chat_message
 * (native Postgres, single source of truth untuk isi pesan, dipakai
 * kedua arah lewat senderType 'VI'/'EX'). exhibitor_app_chat_message
 * kalau tetap dipakai bakal jadi DUA sumber data pesan yang beda tempat
 * - exhibitor app harus nulis ke chat_message yang SAMA (senderType:
 * 'EX'), bukan ke staging terpisah. Tidak ada push-job untuk chat sama
 * sekali - lihat PushService di visitor-app-backend (cuma meeting-action
 * & member-action yang di-push ke MySQL).
 */
export class DropExhibitorAppChatMessageStaging1732950000000
  implements MigrationInterface
{
  name = 'DropExhibitorAppChatMessageStaging1732950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exhibitor_app_chat_message"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Sengaja tidak di-recreate di rollback - kalau perlu mundur, table
    // definition-nya ada di migration 1732920000000 (yang juga jangan
    // di-rollback sendirian, karena isinya digabung dengan meeting_action).
    // Kalau benar-benar perlu, buat migration baru yang eksplisit.
  }
}
