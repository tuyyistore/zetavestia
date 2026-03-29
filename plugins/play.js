import axios from 'axios'

export default {
    name: 'play',
    alias: ['playmusic', 'ytplay', 'lagu'],
    desc: 'Download audio YouTube',
    usage: '.play <judul lagu>',
    info: 'Download dan kirim audio dari YouTube',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'downloader',

    async exec(m, ctx) {
        const { reply, sock, jid, text } = ctx
        if (!text) return reply('Format: .play <judul lagu>')

        try {
            // 1. Ambil data dengan apikey langsung
            const url = `https://api.neoxr.eu/api/play?q=${encodeURIComponent(text)}&apikey=tuyyisky`
            const { data } = await axios.get(url)

            if (!data.status) return reply(`Gagal: ${data.msg || 'API error'}`)

            const res = data.data
            // Ambil URL dari path data.url sesuai JSON yang kamu kasih
            const audioUrl = res.data?.url || res.url 
            
            if (!audioUrl) return reply('Gagal: Link audio tidak ditemukan')

            // 2. Kirim Audio (Langsung URL agar hemat RAM Panel)
            // Gunakan mimetype audio/mp4 karena file YouTube aslinya AAC
            await sock.sendMessage(jid, {
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                fileName: `${res.title || text}.mp3`,
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: res.title || text,
                        body: `Size: ${res.data?.size || 'Unknown'}`,
                        thumbnailUrl: res.thumbnail,
                        sourceUrl: audioUrl,
                        mediaType: 2,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            reply(`Error: ${e.message}`)
        }
    }
}