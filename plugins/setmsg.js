export default {
    name: 'setmsg',
    alias: ['menumsg'],
    desc: 'Set pesan kustom di menu utama',
    usage: '.setmsg <pesan> | .setmsg off',
    info: 'Atur teks kustom yang tampil di menu. Gunakan placeholder seperti +total, +baileys, dll.',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, config, text, isOwner, saveData }) {
        if (!isOwner) return reply(config.ownerOnly)

        if (!text) {
            const current = config.menuMsg || '-'
            const baileys = config.baileysVersion || '@elrayyxml/baileys'
            return reply(
                `》 *Pesan Menu Saat Ini:*\n${current}\n\n` +
                `》 *Placeholder yang tersedia:*\n` +
                `+total   → jumlah perintah\n` +
                `+baileys → versi baileys (${baileys})\n` +
                `+prefix  → prefix bot\n` +
                `+waktu   → waktu sekarang\n` +
                `+botname → nama bot\n` +
                `+owner   → nama owner\n` +
                `+tag     → tag/mention pengirim\n\n` +
                `》 *Contoh penggunaan:*\n\n` +
                `1️⃣ Simple:\n` +
                `.setmsg Halo +tag! Bot aktif dengan +total perintah.\n\n` +
                `2️⃣ Info teknis:\n` +
                `.setmsg 🤖 +botname\n📦 Library: +baileys\n⚡ +total perintah tersedia\n🔑 Prefix: +prefix\n\n` +
                `3️⃣ Gaya aesthetic:\n` +
                `.setmsg ✦ selamat datang +tag ✦\n━━━━━━━━━━━━━━\n🕐 +waktu\n📌 Prefix: +prefix\n🧩 Total: +total cmd\n📦 +baileys\n━━━━━━━━━━━━━━\n\n` +
                `4️⃣ Hapus pesan:\n` +
                `.setmsg off`
            )
        }

        if (text === 'off' || text === 'hapus') {
            config.menuMsg = ''
            await saveData()
            return reply('Pesan menu dihapus.')
        }

        config.menuMsg = text
        await saveData()
        return reply(`Pesan menu diset:\n\n${text}`)
    }
}
