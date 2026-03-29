export default {
    name: 'promote',
    alias: ['jadikan admin'],
    desc: 'Jadikan member sebagai admin grup',
    usage: '.promote @member',
    info: 'Menjadikan member sebagai admin grup',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, sock, jid, config, isOwner, isAdmin, isGroup, isBotAdmin }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)
        if (!await isBotAdmin()) return reply('Bot harus jadi admin grup.')

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const quoted = m.message?.extendedTextMessage?.contextInfo?.participant
        const targets = mentioned.length ? mentioned : quoted ? [quoted] : []
        if (!targets.length) return reply('Tag atau reply member yang mau dijadikan admin.')

        try {
            await sock.groupParticipantsUpdate(jid, targets, 'promote')
            reply(`${targets.length} member berhasil dijadikan admin.`)
        } catch (e) { reply(`Gagal: ${e.message}`) }
    }
}
