export default {
    name: 'unmute',
    alias: ['opengc'],
    desc: 'Unmute grup (semua bisa chat)',
    usage: '.unmute',
    info: 'Membuka grup agar semua member bisa chat',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, sock, jid, config, isOwner, isAdmin, isGroup }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)

        try {
            await sock.groupSettingUpdate(jid, 'not_announcement')
            reply('Grup dibuka. Semua member bisa mengirim pesan.')
        } catch (e) {
            reply(`Gagal: ${e.message}`)
        }
    }
}
