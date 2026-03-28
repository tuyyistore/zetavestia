import axios from 'axios'

export default {
    name: 'tiktok',
    alias: ['tt', 'ttdl'],
    desc: 'Download video TikTok',
    category: 'download',

    async exec(m, { reply, config, args, sock, jid }) {
        const url = args[0]

        if (!url) return reply('Format: .tiktok <link tiktok>\nContoh: .tiktok https://vt.tiktok.com/xxx')
        if (!url.includes('tiktok.com') && !url.includes('vm.tiktok') && !url.includes('vt.tiktok')) {
            return reply('Link tidak valid. Gunakan link dari TikTok.')
        }
        if (!config.apiKey) return reply('API key belum diisi di config.js')

        await reply('⏳ Mengambil video...')

        try {
            const { data } = await axios.get('https://api.neoxr.eu/api/tiktok', {
                params: {
                    url: url,
                    apikey: config.apiKey
                },
                timeout: 15000
            })

            if (!data || data.status !== true) {
                return reply(`Gagal: ${data?.message || 'Respon tidak valid dari API'}`)
            }

            const result = data.data

            // Prioritas video tanpa watermark
            const videoUrl = result.video?.nowm || result.video?.wm || result.video || result.play || null

            if (!videoUrl) return reply('Video tidak ditemukan di respon API.')

            // Download sebagai buffer
            const res = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://www.tiktok.com/'
                }
            })

            const buffer = Buffer.from(res.data)
            const caption = result.title || result.caption || '-'
            const author = result.author?.nickname || result.author || '-'

            await sock.sendMessage(jid, {
                video: buffer,
                caption: `\`\`\`\nJudul  : ${caption}\nPenulis: ${author}\n\`\`\``,
                mimetype: 'video/mp4'
            }, { quoted: m })

        } catch (e) {
            if (e.response?.status === 401) return reply('API key tidak valid atau expired.')
            if (e.response?.status === 429) return reply('Terlalu banyak request. Coba lagi nanti.')
            if (e.code === 'ECONNABORTED') return reply('Timeout. Server API tidak merespon.')
            return reply(`Error: ${e.message}`)
        }
    }
}
