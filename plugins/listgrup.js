export default {
    name: 'listgrup',
    alias: ['listgroup', 'gruplist'],
    desc: 'Lihat semua grup yang diikuti bot',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, sock, isOwner, config }) {
        if (!isOwner) return reply(config.ownerOnly)

        try {
            const groups = await sock.groupFetchAllParticipating()
            const list = Object.values(groups)

            if (!list.length) return reply('Bot belum bergabung ke grup manapun.')

            let teks = '```\nDaftar Grup Bot\n\n'
            list.forEach((g, i) => {
                teks += `${i + 1}. ${g.subject}\n`
                teks += `   Member : ${g.participants.length}\n\n`
            })
            teks += `Total : ${list.length} grup\n\`\`\``

            await reply(teks)
        } catch (e) {
            reply(`Gagal: ${e.message}`)
        }
    }
}
