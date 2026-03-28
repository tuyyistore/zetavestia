export default {
    name: 'setting',
    alias: ['set', 'botset'],
    desc: 'Panel setting bot',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, config, args, isOwner, saveData }) {
        if (!isOwner) return reply(config.ownerOnly)

        const sub = args[0]?.toLowerCase()
        const val = args.slice(1).join(' ')

        if (!sub) {
            const up = process.uptime()
            const h = Math.floor(up / 3600)
            const min = Math.floor((up % 3600) / 60)
            const s = Math.floor(up % 60)

            return reply(`\`\`\`
OWNER SETTING PANEL

Bot Name    : ${config.botName}
Owner       : ${config.ownerName || '-'}
Nomor Owner : ${config.ownerNumber}
Prefix      : ${config.prefix}
Footer      : ${config.footer || '-'}
Session     : ${config.sessionName}
Status      : Online
Uptime      : ${h}j ${min}m ${s}d

Subcommand:
  .set name    <nama>
  .set prefix  <karakter>
  .set owner   <nama>
  .set footer  <teks>
  .set info
\`\`\``)
        }

        if (sub === 'name') {
            if (!val) return reply('Format: .set name <nama>')
            const old = config.botName
            config.botName = val
            await saveData()
            return reply(`Bot name: ${old} -> ${val}`)
        }

        if (sub === 'prefix') {
            if (!val) return reply('Format: .set prefix <karakter>')
            if (val.length > 3) return reply('Prefix maksimal 3 karakter.')
            const old = config.prefix
            config.prefix = val
            await saveData()
            return reply(`Prefix: ${old} -> ${val}`)
        }

        if (sub === 'owner') {
            if (!val) return reply('Format: .set owner <nama>')
            config.ownerName = val
            await saveData()
            return reply(`Nama owner diubah ke: ${val}`)
        }

        if (sub === 'footer') {
            if (!val) return reply('Format: .set footer <teks>')
            config.footer = val
            await saveData()
            return reply(`Footer diubah ke: ${val}`)
        }

        if (sub === 'info') {
            const mem = process.memoryUsage()
            const mb = b => (b / 1024 / 1024).toFixed(1) + ' MB'
            return reply(`\`\`\`
SYSTEM INFO

Node.js   : ${process.version}
Platform  : ${process.platform}
Arch      : ${process.arch}
RAM Heap  : ${mb(mem.heapUsed)} / ${mb(mem.heapTotal)}
RSS       : ${mb(mem.rss)}
\`\`\``)
        }

        return reply(`Subcommand tidak dikenal: ${sub}\nKetik .setting untuk daftar.`)
    }
}
