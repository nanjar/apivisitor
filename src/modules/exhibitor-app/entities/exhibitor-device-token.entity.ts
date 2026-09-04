import { Entity, PrimaryColumn } from 'typeorm';

/** Native (bukan mirror) - device token FCM exhibitor, dicatat apiexhibitor
 * tiap login. Dibaca di sini (apivisitor) buat kirim FCM saat visitor
 * booking meeting / kirim chat ke exhibitor - shared Postgres DB. */
@Entity('exhibitor_device_token')
export class ExhibitorDeviceToken {
  @PrimaryColumn({ name: 'events_id', type: 'int' })
  eventsId: number;

  @PrimaryColumn({ name: 'exhibitor_id', type: 'int' })
  exhibitorId: number;

  @PrimaryColumn({ name: 'device_id', type: 'varchar', length: 255 })
  deviceId: string;
}
