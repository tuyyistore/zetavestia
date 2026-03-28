export default {
    name: 'menu',
    alias: ['help'],
    desc: 'Tampilkan menu bot',
    category: 'user',

    async exec(m, { reply, sock, jid, config, plugins, isOwner, isAdmin, isGroup, args }) {
        const prefix = config.prefix
        const footer = config.footer || ''
        const sub = args[0]?.toLowerCase()

        // Cek apakah sender adalah admin grup
        const senderIsAdmin = isGroup ? await isAdmin() : false

        const categories = {}
        const seen = new Set()

        for (const [, cmd] of plugins.entries()) {
            if (seen.has(cmd.name)) continue
            seen.add(cmd.name)

            // Filter berdasarkan akses
            if (cmd.ownerOnly && !isOwner) continue
            if (cmd.adminOnly && !isOwner && !senderIsAdmin) continue

            const cat = (cmd.category || 'lainnya').toLowerCase()
            if (!categories[cat]) categories[cat] = []
            categories[cat].push(cmd)
        }

        // Urutkan kategori: user -> download -> admin -> owner
        const catOrder = ['user', 'download', 'admin', 'owner']
        const sortedCategories = Object.fromEntries(
            catOrder
                .filter(c => categories[c])
                .map(c => [c, categories[c]])
                .concat(Object.entries(categories).filter(([c]) => !catOrder.includes(c)))
        )

        // .menu <kategori>
        if (sub && sortedCategories[sub]) {
            const cmds = sortedCategories[sub]
            let teks = '```\n'
            teks += `[ ${sub.toUpperCase()} ]\n\n`
            for (const cmd of cmds) {
                teks += `${prefix}${cmd.name}`
                if (cmd.alias?.length) teks += ` | ${prefix}${cmd.alias[0]}`
                teks += `\n`
            }
            teks += `\n${footer}\n\`\`\``
            return reply(teks)
        }

        // .menu utama
        const now = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour12: false,
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })

        let teks = '```\n'
        teks += `${config.botName}\n`
        teks += `Prefix : ${prefix}\n`
        teks += `Waktu  : ${now}\n\n`

        for (const [cat, cmds] of Object.entries(sortedCategories)) {
            teks += `📂 ${cat.charAt(0).toUpperCase() + cat.slice(1).padEnd(8)} (${cmds.length} cmd)\n`
        }

        teks += `\nKetik ${prefix}menu <kategori>\n`
        teks += `\n${footer}\n\`\`\``

        if (config.menuThumbnail) {
            try {
                return await sock.sendMessage(jid, {
                    image: { url: config.menuThumbnail },
                    caption: teks
                }, { quoted: m })
            } catch {}
        }

        await reply(teks)
    }
}
