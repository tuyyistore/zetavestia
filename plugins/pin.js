import axios from 'axios'

export default {
    name: 'pinterest',
    alias: ['pin'],
    category: 'search',
    desc: 'Cari gambar',
    async exec(m, ctx) {
        const { reply, sock, jid, text } = ctx
        if (!text) return reply('Masukkan kueri.')
        try {
            const { data } = await axios.get(`https://api.nexray.web.id/search/pinterest?q=${encodeURIComponent(text)}`)
            const res = data?.data
            if (!res || res.length === 0) return reply('Gambar tidak ditemukan.')
            const img = res[Math.floor(Math.random() * res.length)]
            await sock.sendMessage(jid, { image: { url: img } }, { quoted: m })
        } catch (e) {
            reply('Error.')
        }
    }
}