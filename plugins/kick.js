export default {
    name: 'kick',
    alias: ['keluarkan', 'remove'],
    desc: 'Kick member dari grup',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, sock, jid, config, isOwner, isAdmin, isGroup, isBotAdmin }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)
        if (!await isBotAdmin()) return reply('Bot harus jadi admin grup untuk kick member.')

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const quoted = m.message?.extendedTextMessage?.contextInfo?.participant
        const targets = mentioned.length ? mentioned : quoted ? [quoted] : []
        if (!targets.length) return reply('Tag atau reply pesan member yang mau dikick.')

        let sukses = 0, gagal = 0
        for (const t of targets) {
            try {
                await sock.groupParticipantsUpdate(jid, [t], 'remove')
                sukses++
            } catch { gagal++ }
        }
        reply(`Kick selesai.\nBerhasil : ${sukses}\nGagal    : ${gagal}`)
    }
}
