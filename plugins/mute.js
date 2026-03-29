export default {
    name: 'mute',
    alias: ['closegc'],
    desc: 'Mute grup (hanya admin yang bisa chat)',
    usage: '.mute',
    info: 'Menutup grup agar hanya admin yang bisa chat',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, sock, jid, config, isOwner, isAdmin, isGroup }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)

        try {
            await sock.groupSettingUpdate(jid, 'announcement')
            reply('Grup dimute. Hanya admin yang bisa mengirim pesan.')
        } catch (e) {
            reply(`Gagal: ${e.message}`)
        }
    }
}
