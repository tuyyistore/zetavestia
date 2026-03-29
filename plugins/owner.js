export default {
    name: 'owner',
    alias: ['own'],
    desc: 'Info kontak owner bot',
    usage: '.owner',
    info: 'Menampilkan info kontak owner bot',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'user',

    async exec(m, { reply, config }) {
        const teks = `\`\`\`\nINFO OWNER\n\nNama  : ${config.ownerName || 'Owner'}\nBot   : ${config.botName}\n\`\`\`\nwa.me/${config.ownerNumber}`
        await reply(teks)
    }
}
