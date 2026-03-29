export default {
    name: 'add',
    alias: ['tambah'],
    desc: 'Add member ke grup',
    usage: '.add <nomor>',
    info: 'Menambahkan nomor ke dalam grup',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, sock, jid, config, isOwner, isAdmin, isGroup, args }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)
        if (!args[0]) return reply('Format: .add <nomor>\nContoh: .add 628123456789')

        const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'

        try {
            const res = await sock.groupParticipantsUpdate(jid, [number], 'add')
            const status = res?.[0]?.status
            if (status === '200') return reply('Berhasil menambahkan member.')
            if (status === '403') return reply('Gagal: nomor tidak mengizinkan ditambah ke grup.')
            if (status === '408') return reply('Gagal: nomor tidak terdaftar di WhatsApp.')
            return reply(`Status: ${status}`)
        } catch (e) {
            reply(`Gagal: ${e.message}`)
        }
    }
}
