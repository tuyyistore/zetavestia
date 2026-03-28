Zeta Vestia Wabot

Zeta Vestia adalah WhatsApp Bot modular berbasis Node.js dan Baileys.
Bot ini menggunakan sistem plugin yang terstruktur sehingga memudahkan dalam menambah atau mengedit fitur.

---

Fitur Utama

- Sistem Plugin
  Mudah menambah atau mengedit command melalui folder plugins.

- Group Manager
  Mendukung add, kick, promote, demote, mute, dan unmute.

- Anti-Link
  Mendeteksi dan menangani pengiriman link grup lain.

- Downloader
  Mendukung download TikTok melalui API Neoxr dan Nexray.

- Broadcast
  Mengirim pesan ke semua grup yang diikuti bot.

- Claim Owner
  Sistem untuk mengambil akses owner menggunakan secret key.

---

Instalasi

Prasyarat

- Node.js versi 16 atau lebih baru
- Git
- FFmpeg

---

Langkah-langkah

1. Clone repository
   git clone https://github.com/tuyyistore/zetavestia.git
   cd zetavestia

2. Install dependencies
   npm install

3. Jalankan bot
   node index.js

---

Konfigurasi

export default {
botName: 'Zeta Vestia',
ownerNumber: '62xxxxxxxxxx',
ownerSecret: 'your-secret-key',

neoxrApi: 'API_KEY_Neoxr',
nexrayApi: 'API_KEY_Nexray'
}

---

Struktur Plugin

plugins/
├── admin/
├── owner/
├── download/
├── convert/
└── tools/

---

Author

tuyyi
