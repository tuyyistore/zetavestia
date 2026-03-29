export default {
    name: 'antilink',
    alias: ['al'],
    desc: 'Aktifkan/nonaktifkan anti-link di grup',
    usage: '.antilink on/off',
    info: 'Aktifkan atau nonaktifkan fitur anti-link di grup',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, jid, config, isOwner, isAdmin, isGroup, args, antilinkGroups, saveData }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)

        const sub = args[0]?.toLowerCase()

        if (sub === 'on') {
            antilinkGroups.add(jid)
            await saveData()
            return reply('Anti-link aktif.\nMember yang kirim link akan dikick.')
        }

        if (sub === 'off') {
            antilinkGroups.delete(jid)
            await saveData()
            return reply('Anti-link nonaktif.')
        }

        const status = antilinkGroups.has(jid) ? 'aktif' : 'nonaktif'
        return reply(`Anti-link : ${status}\n\n.antilink on\n.antilink off`)
    }
}
