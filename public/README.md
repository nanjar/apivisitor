# Folder ini di-serve sebagai static file (lihat app.useStaticAssets di main.ts)

Taruh file branding kamu di sini, nanti otomatis bisa diakses via URL:

- `logo.png`  -> https://<domain>/logo.png   (dipakai ganti logo default Swagger, lihat customCss di main.ts)
- `favicon.ico` -> https://<domain>/favicon.ico (dipakai sebagai favicon tab browser Swagger)

Rekomendasi ukuran logo: ~140x40px (landscape/horizontal), background transparan (PNG),
biar pas di topbar Swagger yang tingginya cuma ~40px. Kalau logo kamu kotak/persegi,
sesuaikan `height`/`width` di customCss (src/main.ts) biar gak gepeng.

File ini (README.md) boleh dihapus, cuma placeholder biar folder public/ ke-track di git/zip.
