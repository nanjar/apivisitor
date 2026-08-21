# Undangin Visitor API — Batch 1

NestJS + TypeORM + PostgreSQL, backend untuk Undangin Visitor App.
Batch 1 mencakup: **Login, Home Dashboard, Explore**.
(Splash Screen & Onboarding tidak butuh endpoint — pure UI di Flutter.)

## Mapping Screen → Endpoint

| Screen | Endpoint | Sumber tabel |
|---|---|---|
| Login | `POST /api/v1/auth/login` — body `{ "token": "..." }` | `guests_ticket.token` (didapat visitor saat beli tiket) |
| Login → refresh token | `POST /api/v1/auth/refresh` | JWT refresh token |
| Home Dashboard | `GET /api/v1/home/dashboard` | `events`, `exhibitor_company`, `events_meeting_v2`, `venue_space` — `upcomingAppointments` sekarang sertain `companyId`/`companyName`/`companyLogo` (resolve dari `exhcompany_space` via venue_id+space_id, 19 Aug 2026) |
| Home Dashboard - update FCM device token | `PATCH /api/v1/home/device-id` | **DIROMBAK (13 Aug 2026)** — awalnya nulis ke `guests_ticket.device_id`, TERNYATA ke-overwrite tiap sync MySQL jalan (tabel itu di-refresh periodik dari sumber yang gak punya kolom ini). Sekarang nulis ke `visitor_device_token` (tabel independen, gak disentuh sync) via `PushNotificationsService` — endpoint ini alias/convenience dari `POST /push-notifications/device-token`, dipanggil dari context "buka dashboard" |
| Explore (tab Companies) | `GET /api/v1/explore?tab=companies&keyword=...` | `exhibitor_company` |
| Explore (tab Products) | `GET /api/v1/explore?tab=products&keyword=...` | `exhibitor_product` |
| Explore (tab Categories) | `GET /api/v1/explore?tab=categories` | **belum ada tabel** — return kosong sementara |
| Explore -> Recently Viewed | `GET /api/v1/explore/recently-viewed` | tabel `visitor_company_view_log` (dibuat tim, di luar migration project ini) — **struktur kolom ASUMSI, belum 100% terverifikasi**, lihat catatan di `visitor-company-view-log.entity.ts` |
| Explore filter investment | `GET /api/v1/explore?minInvestment=&maxInvestment=` | filter company yang punya produk dengan investment_fee di rentang tsb (query `exhibitor_product`) |
| Product type - filter chip list | `GET /api/v1/products/types` | `product_type` + `exhibitorproduct_has_type` (jumlah produk per type, buat chip "All (24) \| Automation \| IoT \| dst") |
| Product Search - filter type | `GET /api/v1/products/search?productTypeId=1&productTypeId=2` | **Diubah jadi array (18 Aug 2026)** — bisa filter beberapa type sekaligus (OR, produk yang punya SALAH SATU dari type yang diminta) |
| Product Catalog per company - filter type | `GET /api/v1/companies/:id/products?productTypeId=1&productTypeId=2` | Sama, array |
| Explore tab Products - filter type | `GET /api/v1/explore?tab=products&productTypeId=1&productTypeId=2` | Sama, array |

**Bug ditemukan & diperbaiki (31 Jul 2026, dari testing production):** filter
product type sempat nunjukin data ngaco — 1 produk bisa nunjuk 13 product
type dari company yang beda-beda (dengan duplikat). Penyebabnya:
`exhibitor_product.id` (productId) TIDAK unik lintas company (reset per
company, sama kayak bug composite-key yang pernah ketemu di
`SpeakersService`/`new_session` sebelumnya) — PK asli
`exhibitorproduct_has_type` itu `(events_id, company_id, product_id,
product_type)`, tapi query awal cuma filter `product_id` tanpa
`company_id`, jadi salah nangkep pivot row company lain yang kebetulan
productId-nya sama. Diperbaiki dengan: (1) resolver label pakai composite
key `companyId-productId`, dan (2) filter query utama pakai JOIN langsung
ke pivot table (match `events_id + company_id + product_id` sekaligus),
bukan lagi pola fetch-id-dulu-baru-filter.
| Company Detail | `GET /api/v1/companies/:id` | `exhibitor_company` + `exhibitor` (PIC) + count `exhibitor_product` |
| Product Catalog | `GET /api/v1/companies/:id/products` | `exhibitor_product` |
| Product Search | `GET /api/v1/products/search?keyword=...` | `exhibitor_product` join nama company |
| Product Detail | `GET /api/v1/products/company/:companyId/:productId` | `exhibitor_product` — sekarang sertain `websiteUrl` (`product_url`), `promoUrl`, `instagram`, `facebookUrl`, `tiktokUrl`, `twitterUrl` (kolom yang udah ada dari awal, sebelumnya belum di-map ke entity) |
| Appointment Booking | `POST /api/v1/appointments` | **DIROMBAK TOTAL 31 Jul 2026** — sekarang `agenda_id + meeting_timeslot + meeting_location`, bukan lagi `venue_id/space_id` manual + datetime bebas |
| Appointment Booking - dropdown Day Slot | `GET /api/v1/appointments/agendas` | `new_agenda` |
| Appointment Booking - dropdown Meeting Location | `GET /api/v1/appointments/meeting-locations` | `meeting_location_v2` |
| Appointment Booking - dropdown Time Slot | `GET /api/v1/appointments/time-slots?companyId=&agendaId=` | `company_timeslot` (cuma slot `is_enabled='Y'` & `booked='N'`) |
| Appointment Booking - checkbox Interest | `GET /api/v1/appointments/interest-options` | `interest_options` (dipilih via `interestIds[]` di body booking, disimpan ke pivot `meeting_interest`) |
| Appointment List | `GET /api/v1/appointments?status=upcoming\|pending\|past\|cancelled\|all` | `events_meeting_v2` + `venue_space` |
| Appointment cancel | `PATCH /api/v1/appointments/:id/cancel` | `events_meeting_v2` |
| Chat List | `GET /api/v1/chat/rooms` | `events_chat`, `events_chatmember_v2` |
| Chat Room (history) | `GET /api/v1/chat/:chatId/messages` | `chat_message` (tabel baru, lihat migration) |
| Chat Room (kirim pesan) | WebSocket `chat:send` (ns `/chat`), fallback `POST /api/v1/chat/:chatId/messages` | `chat_message` |
| Event Schedule | `GET /api/v1/schedule` | `new_agenda`, `new_track`, `new_session` |
| Event Schedule (search + filter) | `GET /api/v1/schedule?keyword=&agendaId=&trackId=` | Search lintas NAMA HARI (agenda), NAMA TRACK, dan JUDUL SESI sekaligus — kategori (`session_category`) DIHAPUS (31 Jul 2026), gantiin sama Track |
| Event Schedule - filter chip Track | `GET /api/v1/schedule/tracks?agendaId=` | `new_track` |
| Event Schedule (detail sesi) | `GET /api/v1/schedule/sessions/:id?trackId=&agendaId=` | `new_session`, `session_speaker`, `events_speakers` — sekarang sertain `isSaved` |
| My Schedule | `GET /api/v1/schedule/my-schedule` | tabel baru `visitor_saved_session` |
| Add to My Schedule | `POST /api/v1/schedule/sessions/:id/save?trackId=&agendaId=` | — |
| Remove from My Schedule | `DELETE /api/v1/schedule/sessions/:id/save?trackId=&agendaId=` | — |
| Speaker Detail | `GET /api/v1/speakers/:id` | `events_speakers` (+ kolom baru photo/bio) |
| Interactive Floor Map | `GET /api/v1/venue/floor-map` | `venue_space` — **lihat gap #6** |
| Favorites | `GET /api/v1/favorites`, `POST /api/v1/favorites/toggle` | tabel `visitor_favorite` — **DIROMBAK (19 Aug 2026)**: dari `target_type`/`target_id` polymorphic jadi `company_id` + `product_id` eksplisit (`product_id` gak unik lintas company, jadi WAJIB pasangan sama `company_id`) |
| Notifications | `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/:id/read` | tabel baru `notification` |
| Facilities | `GET /api/v1/facilities` | tabel baru `facility` |
| QR Badge | `GET /api/v1/badge`, `GET /api/v1/badge/checkin-history` | `guests_ticket.token` + `checkin_booth` |
| Profile | `GET /api/v1/profile`, `PATCH /api/v1/profile` | `guests_ticket` |

| Push Notification - register device | `POST /api/v1/push-notifications/device-token` | tabel baru `visitor_device_token` |
| Push Notification - unregister device | `DELETE /api/v1/push-notifications/device-token/:token` | — |

Semua endpoint (kecuali auth) pakai `Authorization: Bearer <accessToken>`.
WebSocket chat: connect ke `/chat` namespace dengan `auth: { token: '<accessToken>' }`.

## Format Tanggal Global: dd/mm/yyyy & dd/mm/yyyy H:i:s (19 Aug 2026)

Semua field bertipe `Date` di response API (SELURUH endpoint, otomatis)
sekarang diformat jadi string, bukan lagi ISO 8601 mentah
(`2026-08-19T07:56:12.687Z`). Diimplementasi via 1 global interceptor
(`DateFormatInterceptor`, `src/common/interceptors/`), BUKAN diubah manual
di tiap DTO/service — biar konsisten otomatis di semua endpoint tanpa
resiko ada yang kelewat.

**Aturan format** (ditentukan dari NAMA FIELD, bukan tipe data):
- Field diakhiri persis `Date` (mis. `startDate`, `endDate`, `agendaDate`)
  → `dd/mm/yyyy` (contoh: `19/08/2026`)
- Field lain yang isinya `Date` (`startDatetime`, `endDatetime`,
  `createdAt`, `updatedAt`, `viewedAt`, `checkinDatetime`, `lastUpdate`,
  dst) → `dd/mm/yyyy H:i:s` (contoh: `19/08/2026 14:30:00`)

**Timezone: di-hardcode `Asia/Jakarta` (WIB)**, TERLEPAS dari timezone OS
server. Ini asumsi — perlu dikonfirmasi apakah semua event emang di WIB,
atau butuh timezone dinamis (WITA/WIT/timezone visitor). Kalau butuh
dinamis, kasih tau, perlu desain ulang (gak bisa 1 nilai fix buat semua
orang).

**Gap yang perlu diketahui:** interceptor ini cuma jalan buat response
REST (HTTP), **BELUM** kepakai buat broadcast WebSocket chat
(`ChatGateway.handleSend` emit langsung ke `server.to(room).emit(...)`,
gak lewat interceptor pipeline). Jadi `createdAt` di pesan chat yang
di-broadcast real-time ke room masih format ISO mentah, sementara respons
REST (`GET /chat/:chatId/messages`) udah ke-format. Perlu diperbaiki
manual di gateway kalau mau konsisten — belum dikerjain karena nunggu
konfirmasi prioritas.

Kalau ada endpoint yang nambah field baru berisi Date, WAJIB ikutin
konvensi penamaan di atas (akhiran persis `Date` = date-only) biar
ke-format otomatis dengan benar tanpa perlu ubah kode interceptor-nya.

## isFavorited Ditambahkan di 3 Endpoint (20 Aug 2026)

Biar FE bisa nampilin ikon hati terisi/kosong tanpa perlu query terpisah
ke `/favorites`, field `isFavorited` (boolean) sekarang otomatis nempel di:

- `GET /explore?tab=companies` — tiap item company
- `GET /companies/:id` — Company Detail
- `GET /products/company/:companyId/:productId` — Product Detail

Semua resolve dari tabel `visitor_favorite` yang udah dirombak
(company_id + product_id eksplisit). Kalau request tanpa autentikasi
(secara teknis gak mungkin karena semua endpoint ini udah di-guard JWT,
tapi sebagai fallback) — `isFavorited` default `false`.

**Cakupan lengkap (20 Aug 2026):**
- `GET /explore?tab=companies` ✅
- `GET /explore?tab=products` ✅
- `GET /companies/:id` (Company Detail) ✅
- `GET /companies/:id/products` (Product Catalog) ✅
- `GET /products/search` (Product Search) ✅
- `GET /products/company/:companyId/:productId` (Product Detail) ✅

Semua tempat yang nampilin company/produk sekarang konsisten punya
`isFavorited`.

## Favorites Dirombak: company_id + product_id, Bukan Polymorphic (19 Aug 2026)

Desain awal `visitor_favorite` pakai pola polymorphic generik
(`target_type`: 'COMPANY'/'PRODUCT', `target_id`: angka) — TERNYATA rawan
bug yang SAMA kayak filter product type sebelumnya: `product_id` di
`exhibitor_product` gak unik lintas company (reset per company), jadi
`target_id` doang gak cukup buat identifikasi produk yang bener.

**Struktur baru:**
- Favorite COMPANY -> `company_id` diisi, `product_id` NULL
- Favorite PRODUCT -> `company_id` diisi (company PEMILIK produknya) DAN
  `product_id` diisi — dua-duanya wajib bareng

**Request body `POST /favorites/toggle` sekarang:**
```json
// Favorite company
{ "companyId": 1 }

// Favorite product (companyId = company pemilik produk itu)
{ "companyId": 1, "productId": 5 }
```

Migration `1732890000000` **TRUNCATE data lama** di `visitor_favorite`
sebelum restructure — kolom lama (`target_type`/`target_id`) gak punya
cukup info buat di-backfill otomatis ke `company_id`/`product_id` (product
favorite lama gak nyimpen company-nya). Dampaknya minim karena fitur ini
baru aja diluncurkan.

Unique constraint pakai `COALESCE(product_id, 0)` biar company-favorite
(product_id NULL) tetap ke-enforce unik per visitor (Postgres default
nganggep NULL selalu "beda" di unique index biasa).

## Pelajaran Penting: Jangan Nulis Kolom Baru di Tabel yang Di-sync (13 Aug 2026)

Sempat coba tambah kolom `guests_ticket.device_id` buat nyimpen FCM token
langsung di tabel visitor — TERNYATA nilainya ke-overwrite balik jadi
`NULL` tiap kali cron sync MySQL->Postgres jalan, karena `guests_ticket`
itu tabel yang di-REFRESH PERIODIK dari sumber (MySQL `corp`) yang gak
kenal kolom `device_id` sama sekali.

**Prinsip ke depan:** APAPUN yang butuh ditulis dari visitor app (bukan
di-generate dari sync), WAJIB masuk ke tabel independen ber-prefix
`visitor_*` (`visitor_favorite`, `visitor_notification`, `visitor_settings`,
`visitor_device_token`, `visitor_saved_session`, dst) — JANGAN PERNAH
nambah kolom custom ke tabel yang sumbernya dari sync MySQL
(`guests_ticket`, `exhibitor_company`, `events_meeting_v2`, dst), karena
bakal ke-timpa balik.

Migration `1732870000000` (nambah kolom) langsung di-revert lewat
`1732880000000`. FCM device token sekarang 100% lewat `visitor_device_token`
(`PushNotificationsService`) yang emang udah didesain independen dari awal.

**Field `platform` WAJIB sesuai device asli** — isi `"ios"` kalau dari
iPhone/iPad, isi `"android"` kalau dari device Android. Ini bukan sekadar
metadata, dipakai buat nentuin format payload notifikasi yang benar (APNs
vs FCM Android) pas backend kirim push nanti. Deskripsi ini juga udah
ditambahin ke `@ApiProperty` di `RegisterDeviceTokenDto`, jadi otomatis
muncul di Swagger UI (`/api/docs`).

## BUG KRITIS: Data Leak Lintas Event di Search (4 Aug 2026)

**Ditemukan dari testing production** — `SearchService` (Universal Search)
dan `AssistantService` (AI Assistant RAG) sempat punya bug SQL klasik:
kondisi keyword `OR` yang di-generate manual via `.join(' OR ')` **TIDAK
dibungkus kurung** sebelum digabung ke `.andWhere()`.

**Kenapa ini bahaya:** SQL `AND` punya precedence lebih tinggi dari `OR`.
```sql
-- Yang dimaksud:
WHERE eventsId = X AND (topic ILIKE kw0 OR topic ILIKE kw1 OR topic ILIKE kw2)

-- Yang BENERAN kejadian tanpa kurung:
WHERE eventsId = X AND topic ILIKE kw0 OR topic ILIKE kw1 OR topic ILIKE kw2
-- ke-parse jadi:
WHERE (eventsId = X AND topic ILIKE kw0) OR topic ILIKE kw1 OR topic ILIKE kw2
```
Filter `eventsId` cuma nempel ke keyword PERTAMA — keyword ke-2 dst bocor
nyari ke **SEMUA event**, bukan cuma event visitor yang login. Baru
kena pas query di-parse Ollama jadi >1 keyword (mayoritas query natural
language emang gitu) — makanya ke-detect telat, testing awal pakai
1 keyword doang ("sesi") kebetulan gak nunjukin bug-nya.

**Fix:** semua `buildKeywordClause`/OR-clause manual sekarang WAJIB
dibungkus `(...)`. Sudah diperbaiki di:
- `SearchService.buildKeywordClause` (dipakai 4 fungsi: companies/products/sessions/speakers)
- `AssistantService.findRelevantCompanies` (RAG context buat AI Assistant)

Sudah di-cross-check ke seluruh codebase (`grep` semua pola OR manual) —
tempat lain (`NotificationsService`, `ProductsService`, `ScheduleService`)
sudah benar dari awal, gak kena bug ini.

**Pelajaran buat ke depan:** kalau bikin OR-clause manual sebagai raw SQL
string yang bakal digabung via `.andWhere()`, WAJIB bungkus kurung
eksplisit — jangan asumsikan TypeORM otomatis nge-wrap.

## Typing Indicator & Push Notification (31 Jul 2026)

**Typing indicator** — murni WebSocket, event baru di namespace `/chat`:
- Client -> server: `chat:typing` dengan `{ chatId, isTyping: boolean }`
- Server -> client lain di room (BUKAN ke pengirim): `chat:typing` dengan
  `{ chatId, guestsId, fullname, isTyping }`
- Auto-clear server-side 5 detik kalau client gak kirim `isTyping: false`
  (jaga-jaga kalau app crash/koneksi putus mendadak) dan otomatis clear pas
  pesan beneran terkirim (`chat:send`).

**Push Notification (FCM)** — keputusan arsitektur: chat existing pakai
Firebase, tapi setelah dibandingkan biayanya (Firebase = per-operasi
read/write/listener, WebSocket = flat pakai compute server yang udah ada),
diputuskan **pindah ke WebSocket buat data chat**, TAPI **tetap pakai FCM
khusus buat push notification** (2 layanan Firebase yang terpisah — FCM
gak butuh Firestore/Realtime Database sama sekali).

- `FirebaseAdminService` (`src/modules/push-notifications/`) — wrapper FCM,
  **fail-open**: kalau `FIREBASE_SERVICE_ACCOUNT_PATH` kosong/invalid, push
  notification otomatis nonaktif TANPA bikin app gagal start. Chat via
  WebSocket tetap jalan normal walau FCM belum di-setup.
- Device token disimpan per (events_id, guests_id, device_token) di tabel
  `visitor_device_token` — 1 visitor bisa punya banyak device.
- Trigger: `ChatService.sendMessage` otomatis push notif ke member
  **VISITOR** lain di room (fire-and-forget, gagal kirim push gak gagalin
  pengiriman chat).

### Gap penting soal Push Notification ke Exhibitor PIC

18. ~~Push notification HANYA jalan buat sisi VISITOR~~ **Diselesaikan
    sementara (31 Jul 2026) via outbound webhook** — solusi transisi.
    `WebhookService` (`src/modules/webhooks/`) POST ke
    `EXHIBITOR_CHAT_WEBHOOK_URL` tiap kali visitor kirim pesan ke member
    ber-`usertypeId = 'EX'` (PIC), payload di-sign HMAC-SHA256 pakai
    `EXHIBITOR_CHAT_WEBHOOK_SECRET` (header `X-Webhook-Signature`). Tim
    Exhibitor tinggal bikin endpoint penerima webhook itu, verifikasi
    signature-nya, terus trigger notifikasi ke PIC pakai sistem mereka
    sendiri (Firebase/apapun).

    **Payload webhook** (`POST` ke `EXHIBITOR_CHAT_WEBHOOK_URL`):
    ```json
    {
      "eventsId": 22834,
      "chatId": 23,
      "companyId": 1,
      "recipientMemberId": 45,
      "senderGuestsId": 95,
      "senderName": "Ari Undangin #1",
      "message": "halo, ada info produk?",
      "sentAt": "2026-07-31T12:00:00.000Z"
    }
    ```

    **Keterbatasan solusi transisi ini** (sengaja simpel, bukan solusi
    permanen): 1x percobaan doang, timeout 5 detik, TIDAK ada retry queue —
    kalau endpoint Exhibitor lagi down pas webhook dikirim, notifikasi ke
    PIC itu ya hilang (chat message-nya sendiri tetap aman tersimpan,
    cuma notifikasinya yang gak sampai). Kalau butuh keandalan lebih
    (retry otomatis, dead-letter queue), perlu infra tambahan (mis. BullMQ)
    di luar scope solusi transisi ini.

    **Arah jangka panjang** (belum diputuskan, perlu didiskusikan): kalau
    exhibitor app juga akhirnya pindah dari Firebase ke Postgres+WebSocket
    yang sama kayak visitor app ini, webhook ini gak perlu lagi — device
    token PIC bisa langsung disimpan di 1 backend yang sama.

19. **Fitur "Start Chat dengan PIC Company"** (bikin chat room baru dari
    visitor app, bukan cuma baca room yang udah ada) BELUM diimplementasikan
    — masih nunggu sample data struktur `events_chat`/`events_chatmember_v2`
    yang lengkap (kedua sisi visitor & exhibitor) supaya INSERT ke tabel
    legacy itu gak salah format dan bikin data korup di sistem admin lama.

## Cara Jalanin

```bash
npm install
cp .env.example .env   # isi kredensial Postgres hasil sync
npm run migration:run  # tambah kolom auth ke guests_ticket
npm run start:dev
```

## Gap Skema yang Perlu Diklarifikasi

1. ~~`guests_ticket` tidak punya kolom password~~ **Sudah diselesaikan**:
   auth visitor app tidak pakai email/password, tapi validasi `token`
   unik yang sudah ada di kolom `guests_ticket.token` (digenerate sistem
   tiketing saat visitor beli tiket).

   **Alur login (dikonfirmasi):** visitor beli tiket → dapat link berisi
   token (mis. `https://app.undangin.id/visitor?token=xxx`) → link
   diklik → Flutter app terbuka via deep link/Universal Link, extract
   `token` dari query param → app langsung `POST /auth/login` dengan
   token itu → kalau valid, terbitkan JWT dan lempar ke Home Dashboard;
   kalau tidak, tampilkan layar "Akses ditolak" (401 dari endpoint ini).
   Tidak ada form input token manual sebagai jalur utama — link adalah
   satu-satunya cara masuk.

   **Yang perlu disiapkan di luar NestJS (FE/infra), bukan API:**
   - iOS: `apple-app-site-association` di-host di domain link tersebut
     supaya link membuka app (Universal Links), bukan browser.
   - Android: `assetlinks.json` di `.well-known/` untuk App Links.
   - Fallback kalau app belum ter-install: link tetap harus membuka
     halaman web (mis. "Download di App Store/Play Store") — biasanya
     landing page statis terpisah dari API ini.

2. ~~Relasi Company ↔ Booth/Hall belum jelas~~ **Diselesaikan ulang (31 Jul
   2026), sumbernya diperbaiki.** Versi awal salah pakai `checkin_booth`
   (riwayat SCAN visitor) buat nebak lokasi booth company — itu salah
   konsep, karena checkin_booth cuma nyatet histori kunjungan, bukan data
   assignment booth resmi. Sekarang `BoothResolverService` pakai sumber
   yang benar:
   - `exhcompany_space` -> venue_id + space_id RESMI milik company
     (di-assign organizer/exhibitor, bukan hasil scan)
   - `venue_space` -> nama booth (`hallLabel`) & detail (`boothLabel`)
   - `location_address` -> nama venue (`venueName`, field BARU di response
     Home/Explore/Company Detail)

   `checkin_booth` TETAP dipakai di tempat yang memang soal riwayat
   kunjungan (QR Badge checkin history, Visitor Analytics booth visited
   count) — itu penggunaan yang benar, gak diubah.

3. **Jarak booth ("120 m") di card Explore/Home belum ada sumber datanya**
   — kemungkinan perlu koordinat booth (x,y) + posisi user untuk dihitung
   real-time, bukan data statis. Belum diimplementasi.

4. **Kategori/industri perusahaan** ("Food & Beverages", "Industrial
   Machinery") belum ada tabel referensinya di data yang dikirim.

5. **Appointment milik visitor** saat ini hanya query berdasar
   `initiator_id` (asumsi visitor selalu inisiator). Appointment yang
   dibuat exhibitor untuk visitor tertentu butuh tabel partisipan
   terpisah — perlu dikonfirmasi apakah itu ada di tabel lain yang belum
   dikirim.

6. **Chat history granular belum ada di skema legacy** — `events_chat`
   cuma simpan snapshot pesan terakhir. Tabel baru `chat_message` sudah
   dibuat via migration khusus untuk visitor app; sistem lama (exhibitor
   admin web) TIDAK otomatis dapat history ini kecuali di-sync juga.

7. **Interactive Floor Map belum punya data koordinat.** `venue_space`
   tidak ada kolom `pos_x`/`pos_y`, dan tidak ada tabel `venue` terpisah
   untuk gambar denah (floor plan image). Endpoint saat ini hanya
   mengembalikan daftar booth per `venue_id`, belum bisa render pin
   interaktif di atas denah sampai skema tambahan tersedia.

8. **Speaker photo/bio/company_name** ditambahkan via migration karena
   tidak ada di `events_speakers` asli — perlu data entry ulang dari
   organizer untuk kolom-kolom ini.

9. **Favorites, Notifications, Facilities** — tidak ada tabelnya sama
   sekali di skema legacy. Tabel baru `favorite`, `notification`,
   `facility` dibuat khusus untuk visitor app (lihat migration
   `1732830000000-CreateBatch4Tables`). Konsekuensinya:
   - Sistem lama (web admin exhibitor/organizer) TIDAK otomatis bisa
     kirim notification ke tabel ini kecuali diintegrasikan terpisah
     (mis. webhook/cron dari sistem appointment & chat yang insert ke
     `notification`).
   - Data `facility` perlu diisi manual oleh organizer — belum ada
     tooling admin untuk itu (di luar scope visitor API ini).

10. **QR Badge — sisi "scan" ada di aplikasi Exhibitor, bukan di sini.**
    Endpoint `/badge` di visitor app cuma nampilkan `token` (buat
    di-render jadi QR image di Flutter, misal pakai `qr_flutter`) dan
    riwayat checkin. Insert baris baru ke `checkin_booth` dilakukan
    exhibitor app saat scan — kalau exhibitor app juga perlu dibikin di
    NestJS, itu project terpisah dari visitor API ini.

11. **Notification broadcast belum punya per-user read state.** Baris
    dengan `guests_id = NULL` (broadcast) kalau ditandai "read" oleh satu
    visitor, baris itu jadi read untuk visitor lain juga (karena masih 1
    baris fisik). Kalau butuh read-state independen per visitor untuk
    broadcast, perlu tabel `notification_read` terpisah — belum
    diimplementasikan karena menunggu konfirmasi apakah ini benar-benar
    dibutuhkan atau broadcast cukup "sudah pernah muncul di List".

12. ~~Asumsi kode status login belum 100% terverifikasi~~ **Sudah
    diselesaikan (30 Jul 2026):** syarat `paid = 'Y'` DIHAPUS dari validasi
    login atas permintaan — sekarang `AuthService.loginWithToken` HANYA
    cek `approval_status = 'AP'`. Alasannya: tiket gratis/komplimenter
    kemungkinan `paid`-nya tetap `'N'` walau statusnya udah `'AP'`, jadi
    kalau tetap ikut dicek bisa salah nolak visitor yang sah.

13. **Refresh token belum ada revocation list.** JWT refresh token
    bersifat stateless -- kalau device hilang/dicuri, refresh token lama
    tetap valid sampai expired (7 hari) walau sudah dipakai refresh ulang.
    Untuk production, idealnya tambah tabel `refresh_token` (simpan hash
    token + status revoked) supaya bisa di-invalidate manual (logout paksa,
    device hilang). Belum diimplementasikan karena butuh keputusan
    trade-off stateless vs stateful yang sebaiknya dikonfirmasi dulu.

14. **Access token SEKARANG TANPA EXPIRY** (diubah 30 Jul 2026 atas
    permintaan — visitor gak perlu login ulang selama event berlangsung).
    Konsekuensi: TIDAK ADA cara revoke akses 1 visitor tertentu (mis. kalau
    tiketnya dibatalkan/refund setelah login) — token lama tetap valid
    selamanya. Satu-satunya cara "logout paksa" adalah rotate
    `JWT_ACCESS_SECRET`, yang bakal nge-logout SEMUA visitor sekaligus,
    bukan cuma satu orang. Refresh token flow (`/auth/refresh`) masih ada
    tapi jadi kurang relevan karena access token gak pernah expired duluan.
    Trade-off ini sengaja diambil demi UX (bukan bug) — kalau nanti butuh
    revoke granular per-visitor, perlu tabel token-blacklist/session-store
    terpisah.

## Status: Batch 1-4 selesai & sudah di-review ulang

- Semua entity di-cross-check terhadap `ADD PRIMARY KEY` asli di dump SQL
  -- cocok semua, tidak ada mismatch composite key.
- Bug ditemukan & diperbaiki: `SpeakersService.getDetail` sempat query
  `new_session` cuma pakai `id` + `events_id`, padahal `id` tidak unik per
  event (reset per track/agenda) -- sudah diperbaiki pakai composite key
  penuh.
- Race condition ditemukan & diperbaiki: `AppointmentsService.create`
  (overlap-check booking) dan `ChatService.sendMessage` (3 write terpisah)
  sekarang jalan dalam 1 database transaction (yang pertama pakai Postgres
  advisory lock per booth supaya tidak race).
- `tsconfig.json` sekarang permanen strict soal unused imports/variables
  (`noUnusedLocals`, `noUnusedParameters`).
- Type-check bersih di semua 4 batch.

Batch 5 SELESAI (30 Jul 2026) — Settings, AI Assistant, Universal Search,
AI Exhibitor Recommendation, Visitor Analytics. Semua pakai Ollama lokal
(server terpisah, model `qwen3:8b`) via `OllamaService` di `src/modules/ai/`.

## Mapping Batch 5

| Screen | Endpoint | Catatan |
|---|---|---|
| Settings | `GET/PATCH /api/v1/settings` | Tabel baru `visitor_settings` (bahasa, toggle notifikasi) |
| AI Assistant | `POST /api/v1/ai/assistant/chat` | Body `{ messages: [{role, content}] }`. RAG ringan: cari company relevan dari pesan terakhir via keyword match, diinjeksi ke system prompt. Kalau Ollama down -> `503` dengan pesan ramah, bukan 500 |
| Universal Search | `POST /api/v1/search/universal` | Body `{ query: "..." }`. Ollama extract entityTypes+keywords dari bahasa natural, lalu search DB. Kalau Ollama gagal -> fallback keyword search ke SEMUA entity type pakai raw query |
| AI Exhibitor Recommendation | `GET /api/v1/recommendations/exhibitors` | Exclude company yang sudah dikunjungi/difavoritkan. AI ranking via Ollama, fallback heuristik (company paling baru update) kalau Ollama gagal — response selalu ada field `source: 'ai'\|'heuristic'\|'none'` biar FE tau mana yang dipakai |
| Visitor Analytics | `GET /api/v1/analytics/me` | Murni agregasi SQL (booth dikunjungi, appointment per status, jumlah favorite, jumlah chat room) — TIDAK pakai AI |

### Prinsip desain AI di batch ini

- **Semua fitur AI wajib punya fallback non-AI.** Ollama server terpisah,
  bisa down/lambat/network putus kapan aja — endpoint gak boleh 500 total
  cuma gara-gara itu. Universal Search fallback ke plain keyword search;
  Recommendation fallback ke heuristik; Assistant balikin 503 (bukan 500)
  dengan pesan yang jelas ini masalah AI service, bukan bug.
- **JSON parsing dari LLM lokal defensif.** Model 8B kadang nyisipin teks
  di luar JSON meski diinstruksikan strict — `OllamaService.generateJson()`
  strip markdown fence dan ekstrak substring `{...}`/`[...]` sebelum parse,
  throw `OllamaUnavailableError` kalau tetap gagal (bukan crash).
- **Bukan semantic search/vector DB.** RAG di AI Assistant & context di
  Universal Search masih keyword-match biasa ke kolom nama — cukup buat
  ngasih Ollama konteks nyata dari database (hindari halusinasi), TAPI
  bukan true semantic search. Kalau butuh itu nanti (embedding + vector
  DB), itu scope terpisah yang perlu dibahas lagi.

### Gap/keputusan yang perlu diketahui

14. **`OLLAMA_BASE_URL` wajib diisi ke server Ollama yang benar** di
    `.env` sebelum start — beda dari asumsi awal (localhost), sesuai
    konfirmasi kamu Ollama jalan di server terpisah.
15. **AI Assistant gak nyimpen riwayat percakapan di server** (stateless
    per-request, client kirim `messages` history lengkap tiap kali). Kalau
    butuh riwayat chat persisten lintas sesi, perlu tabel baru
    (`ai_conversation` + `ai_message`) — belum diimplementasikan.
16. **AI Exhibitor Recommendation profilnya masih tipis** — cuma pakai
    `company_name` visitor dari `guests_ticket` (field lain kayak
    `profession_id`/`division_id`/`companytype_id` ada di skema tapi belum
    dipetakan ke tabel referensinya karena tabel lookup-nya belum dikirim).
    Kalau tabel `profession`/`division`/`companytype` dikirim, rekomendasi
    bisa lebih presisi.
17. **`qwen3:8b` model reasoning-nya kadang nyisipin `<think>` tag** di
    output (kebiasaan model Qwen3) yang bisa ganggu parsing JSON. Kalau
    kejadian, tambahkan instruksi eksplisit "jangan tampilkan proses
    berpikir" di prompt, atau pertimbangkan set parameter Ollama
    `think: false` kalau tersedia di versi Ollama kamu.

## Appointment Booking — Alur Baru (31 Jul 2026)

Dirombak total dari `venue_id`/`space_id` manual jadi `agenda_id` +
`meeting_timeslot` + `meeting_location`, sesuai screen "Meeting Setup" yang
sebenarnya. Detail:

**Request body `POST /appointments` sekarang:**
```json
{
  "companyId": 1,
  "agendaId": 1,
  "timeSlot": "09:00",
  "meetingLocationId": 1,
  "leadTemperature": "Cold",
  "notes": "opsional"
}
```

**Alur validasi:**
1. Cek `agenda_id` valid & punya tanggal
2. Cek `meeting_location_id` valid & aktif
3. Cek slot `(companyId, agendaId, timeSlot)` di `company_timeslot` masih
   `is_enabled='Y'` DAN `booked='N'` (dikunci pakai Postgres advisory lock
   biar gak race condition kalau 2 visitor rebutan slot sama-sama)
4. Booth company (`venue_id`/`space_id` di `events_meeting_v2`) di-resolve
   OTOMATIS dari `exhcompany_space` — visitor gak perlu milih ini manual
5. Slot ditandai `booked='Y'`, insert `events_meeting_v2`
6. **Cancel otomatis lepas slot lagi** (`booked='N'`) biar bisa diambil
   visitor lain

**Gap/asumsi yang perlu dikonfirmasi:**

20. **Durasi meeting di-hardcode 45 menit** (`MEETING_DURATION_MINUTES` di
    `appointments.service.ts`). Gak ada kolom durasi eksplisit di skema
    (`company_timeslot` cuma titik waktu mulai per 15 menit) — perlu
    dikonfirmasi apakah 45 menit itu bener sesuai kebijakan event, atau
    harusnya beda (30/60 menit, atau dinamis dari selisih slot berikutnya).

21. ~~"Interest 1"/"Interest 2" checkbox BELUM diimplementasikan~~
    **Sudah diselesaikan (31 Jul 2026)** — ternyata ada tabel resmi
    `interest_options` (daftar pilihan) + pivot `meeting_interest`
    (many-to-many ke meeting). `interest_options.interest_for` disimpan
    tapi BELUM dipakai buat filter (belum jelas semantiknya persis FK ke
    apa) — kalau ternyata itu perlu buat scoping per company/kategori,
    kasih tau, saya tambahin filternya.

22. **`leadTemperature` (Cold/Warm/Hot) disimpan ke `meeting_score`** —
    asumsi kolom yang tepat berdasar nama & tipe (`varchar(10)`), tapi
    belum ada konfirmasi apakah value yang diterima sistem lain persis
    string `"Cold"/"Warm"/"Hot"` atau format lain (mis. angka 1/2/3).

## i18n — Support Bahasa Indonesia & English (30 Jul 2026)

Pakai `nestjs-i18n`. Semua pesan error bisnis (NotFound/BadRequest/dst di
seluruh service) dan balasan AI Assistant sekarang di-translate, bukan
hardcoded Bahasa Indonesia lagi.

**Cara pilih bahasa (client kirim salah satu, urutan prioritas):**
1. Header `x-lang: en` (paling direkomendasikan buat Flutter app — set
   sekali dari `visitor_settings.language` visitor yang login, kirim di
   tiap request)
2. Query param `?lang=en`
3. Header `Accept-Language: en`
4. Kalau gak ada semua -> fallback `id`

**File terjemahan:** `src/i18n/id/messages.json` dan `src/i18n/en/messages.json`.
Tambah key baru di KEDUA file kalau nambah pesan error baru di service manapun.

**AI Assistant** otomatis jawab dalam bahasa yang sama (instruksi eksplisit
di system prompt Ollama), gak cuma nurut bahasa pertanyaan visitor.

**Yang BELUM di-i18n-kan** (scope terbatas, bisa ditambah kalau perlu):
- Pesan error dari `class-validator` (DTO validation, mis. "token should
  not be empty") masih default Bahasa Inggris bawaan library — belum
  di-wire ke `nestjs-i18n`'s validation message resolver. Kalau visitor
  app butuh ini juga ter-translate, kasih tau, saya lanjutkan (perlu
  effort tambahan karena harus disetel per-field di tiap DTO).
- Konten data dari database (nama company, deskripsi produk, dll) TETAP
  apa adanya sesuai yang di-input exhibitor/organizer — bukan tanggung
  jawab API buat nerjemahkan data user-generated.
