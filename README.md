# Zeta Vestia Wabot

Zeta Vestia adalah WhatsApp Bot modular yang dibuat menggunakan Node.js dan Baileys. Bot ini punya sistem plugin yang rapi, jadi gampang kalau mau nambah fitur tinggal bikin file baru di folder plugins.

---

## Fitur Utama

* Sistem Plugin: Gampang buat nambah/edit command.
* Group Manager: Kick, add, promote, demote, mute, dan unmune.
* Anti-Link: Auto kick kalau ada yang share link grup lain.
* Downloader: Download TikTok via Neoxr & Nexray API.
* Broadcast: Kirim pesan ke semua grup.
* Claim Owner: Sistem aman buat ambil alih akses owner lewat secret key.

---

## Instalasi

### Prasyarat
* Node.js v16+
* Git
* FFmpeg

### Langkah-langkah
1. Clone Repository
   ```bash
   git clone [https://github.com/tuyyistore/zetavestia.git](https://github.com/tuyyistore/zetavestia.git)
   cd zetavestia
   npm install

Konfigurasi
Edit file config.js dan sesuaikan:
botName: Nama bot.
ownerNumber: Nomor owner.
ownerSecret: Kode rahasia buat .claimowner.
neoxrApi: API Key dari api.neoxr.eu (Opsional).
nexrayApi: API Key dari api.nexray.web.id (Opsional).


Author : tuyyi
   
