export default {
    name: 'grupinfo',
    alias: ['gcinfo', 'infogroup', 'infogrup'],
    desc: 'Lihat info grup',
    category: 'user',

    async exec(m, { reply, sock, jid, config, isGroup }) {
        if (!isGroup) return reply(config.groupOnly)

        try {
            const meta = await sock.groupMetadata(jid)

            const total = meta.participants.length
            const admins = meta.participants.filter(p => p.admin).length
            const members = total - admins

            const created = new Date(meta.creation * 1000).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: '2-digit', month: '2-digit', year: 'numeric'
            })

            const teks = `\`\`\`
INFO GRUP

Nama      : ${meta.subject}
Deskripsi : ${meta.desc || '-'}
ID Grup   : ${jid.replace('@g.us', '')}
Dibuat    : ${created}

Member    : ${members} orang
Admin     : ${admins} orang
Total     : ${total} orang
\`\`\``

            await reply(teks)
        } catch (e) {
            await reply(`Gagal ambil info grup: ${e.message}`)
        }
    }
}
