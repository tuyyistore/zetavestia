export default {
    name: 'setppgc',
    alias: ['setpp', 'setfoto'],
    desc: 'Ganti foto profil grup',
    category: 'admin',
    adminOnly: true,

    async exec(m, { reply, sock, jid, isOwner, isAdmin, isGroup, config, getImageBuffer }) {
        if (!isOwner && !await isAdmin()) return reply(config.adminOnly)
        if (!isGroup) return reply(config.groupOnly)

        const buffer = await getImageBuffer()
        if (!buffer) return reply('Tidak ada gambar.\n\nCara pakai:\n- Kirim gambar + Reply gambar lalu ketik .setppgc')

        try {
            await sock.updateProfilePicture(jid, buffer)
            await reply('Foto profil grup berhasil diubah.')
        } catch (e) {
            if (e.message?.includes('not-authorized')) {
                await reply('Bot harus jadi admin grup untuk mengubah foto profil.')
            } else {
                await reply(`Gagal: ${e.message}`)
            }
        }
    }
}