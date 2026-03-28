import axios from 'axios'
import sharp from 'sharp'

export default {
    name: 'brat',
    alias: ['brattext'],
    desc: 'Buat sticker teks gaya brat',
    category: 'convert',

    async exec(m, { sock, jid, config, text }) {
        if (!text) return

        try {
            const { data } = await axios.get('https://api.neoxr.eu/api/brat', {
                params: { text, apikey: config.apiKey },
                timeout: 15000
            })

            const imageUrl = data?.data?.downloadUrl || data?.data?.url
            if (!imageUrl) return

            const imgRes = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 15000
            })

            const stickerBuffer = await sharp(imgRes.data)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 85 })
                .toBuffer()

            await sock.sendMessage(jid, {
                sticker: stickerBuffer
            })

        } catch (e) {
            console.error('Brat error:', e)
        }
    }
}