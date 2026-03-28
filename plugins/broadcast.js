export default {
    name: 'broadcast',
    alias: ['bc'],
    desc: 'Kirim pesan ke semua grup',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, sock, text, isOwner, config }) {
        if (!isOwner) return reply(config.ownerOnly)
        if (!text) return reply('Format: .broadcast <pesan>')

        await reply('Memulai broadcast...')

        try {
            const chats = await sock.groupFetchAllParticipating()
            const jids = Object.keys(chats)
            let sukses = 0, gagal = 0

            for (const jid of jids) {
                try {
                    await sock.sendMessage(jid, { text: `Broadcast dari Owner\n\n${text}` })
                    sukses++
                    await new Promise(r => setTimeout(r, 500))
                } catch { gagal++ }
            }

            await reply(`Broadcast selesai.\nBerhasil : ${sukses} grup\nGagal    : ${gagal} grup`)
        } catch (e) {
            await reply(`Error: ${e.message}`)
        }
    }
}
