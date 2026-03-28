export default {
    name: 'tagall',
    alias: ['mentionall', 'alltag'],
    desc: 'Tag semua member grup',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, sock, jid, config, isOwner, isAdmin, isGroup, text }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)

        try {
            const meta = await sock.groupMetadata(jid)
            const members = meta.participants.map(p => p.id)

            const pesan = text || 'Perhatian semua member!'
            const mention = members.map(id => `@${id.split('@')[0]}`).join(' ')

            await sock.sendMessage(jid, {
                text: `${pesan}\n\n${mention}`,
                mentions: members
            }, { quoted: m })

        } catch (e) {
            await reply(`Gagal tagall: ${e.message}`)
        }
    }
}
