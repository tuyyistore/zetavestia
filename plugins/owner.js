export default {
    name: 'owner',
    alias: ['own'],
    desc: 'Info kontak owner bot',
    category: 'user',

    async exec(m, { reply, config }) {
        const teks = `\`\`\`\nINFO OWNER\n\nNama  : ${config.ownerName || 'Owner'}\nBot   : ${config.botName}\n\`\`\`\nwa.me/${config.ownerNumber}`
        await reply(teks)
    }
}
