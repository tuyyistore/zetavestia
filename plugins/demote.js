export default {
    name: 'demote',
    alias: ['deadmin'],
    desc: 'Cabut admin member dari grup',
    usage: '.demote @member',
    info: 'Mencabut status admin dari member',
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
        if (!targets.length) return reply('Tag atau reply admin yang mau dicabut.')

        try {
            await sock.groupParticipantsUpdate(jid, targets, 'demote')
            reply(`${targets.length} admin berhasil dicabut.`)
        } catch (e) { reply(`Gagal: ${e.message}`) }
    }
}
