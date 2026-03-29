import { writeFile } from 'fs/promises'

export default {
    name: 'claimowner',
    desc: 'Claim owner via secret key (sekali pakai)',
    usage: '.claimowner <secret>',
    info: 'Klaim akses owner dengan secret key (sekali pakai)',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'owner',

    async exec(m, { reply, sender, config, text }) {
        if (!config.ownerSecret) return reply('ownerSecret belum di-set di config.')
        if (text.trim() !== config.ownerSecret) return reply('Secret salah.')
        if (config.ownerLid === sender) return reply('Kamu sudah terdaftar sebagai owner.')

        config.ownerLid = sender

        const cfgPath = new URL('../config.js', import.meta.url).pathname
        const raw = await import('fs/promises').then(fs => fs.readFile(cfgPath, 'utf-8'))
        const updated = raw.replace(
            /ownerLid:\s*["'][^"']*["']/,
            `ownerLid: "${sender}"`
        )
        await writeFile(cfgPath, updated)
        await reply(`✓ Owner lid tersimpan: ${sender}`)
    }
}
