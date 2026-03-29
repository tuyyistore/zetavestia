import axios from 'axios'

export default {
    name: 'tiktok',
    alias: ['tt', 'ttdl'],
    desc: 'Download video TikTok',
    usage: '.tiktok <link>',
    info: 'Download video TikTok tanpa watermark',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'download',

    async exec(m, { reply, config, args, sock, jid }) {
        const url = args[0]

        if (!url) return reply('Format: .tiktok <link tiktok>')
        if (!config.apiKey) return reply('API key belum diisi di config.js')

        await reply('bentar 🗿')

        try {
            const { data } = await axios.get('https://api.neoxr.eu/api/tiktok', {
                params: { url, apikey: config.apiKey },
                timeout: 15000
            })

            if (!data?.status) return reply(`Gagal: ${data?.message || 'Respon tidak valid'}`)

            const result = data.data
            const videoUrl = result.video || null

            if (!videoUrl) return reply('Video tidak ditemukan.')

            // Download dulu jadi buffer
            const res = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://www.tiktok.com/'
                }
            })

            const buffer = Buffer.from(res.data)

            await sock.sendMessage(jid, {
                video: buffer,
                caption: `\`\`\`\nCaption : ${result.caption || '-'}\nPenulis : ${result.author?.nickname || '-'}\n\`\`\``,
                mimetype: 'video/mp4'
            }, { quoted: m })

        } catch (e) {
            if (e.response?.status === 401) return reply('API key tidak valid.')
            if (e.response?.status === 429) return reply('Rate limit. Coba lagi nanti.')
            if (e.code === 'ECONNABORTED') return reply('Timeout.')
            return reply(`Error: ${e.message}`)
        }
    }
}