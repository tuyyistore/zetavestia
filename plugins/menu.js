export default {
    name: 'menu',
    alias: ['help'],
    desc: 'Tampilkan menu bot',
    usage: '.menu [kategori]',
    info: 'Tampilkan menu utama atau sub-kategori tertentu',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'user',

    async exec(m, { reply, sock, jid, config, plugins, isOwner, isAdmin, isGroup, args }) {
        const prefix = config.prefix
        const footer = config.footer || config.botName
        const sub = args[0]?.toLowerCase()
        const sender = m.key.participant || m.key.remoteJid

        const senderIsAdmin = isGroup ? await isAdmin() : false

        // ─── Kumpulkan kategori & command ─────────────────────────────────────
        const categories = {}
        const seen = new Set()

        for (const [, cmd] of plugins.entries()) {
            if (seen.has(cmd.name)) continue
            seen.add(cmd.name)

            if (cmd.ownerOnly && !isOwner) continue
            if (cmd.adminOnly && !isOwner && !senderIsAdmin) continue

            const cat = (cmd.category || 'lainnya').toLowerCase()
            if (!categories[cat]) categories[cat] = []
            categories[cat].push(cmd)
        }

        const catOrder = ['user', 'download', 'admin', 'owner']
        const sortedCategories = Object.fromEntries(
            catOrder
                .filter(c => categories[c])
                .map(c => [c, categories[c]])
                .concat(Object.entries(categories).filter(([c]) => !catOrder.includes(c)))
        )

        const line = '─────────────────────'

        // ─── .menu <kategori> ─────────────────────────────────────────────────
        if (sub && sortedCategories[sub]) {
            const cmds = sortedCategories[sub]
            const label = sub.charAt(0).toUpperCase() + sub.slice(1)

            let teks = '```\n'
            teks += `[ ${label.toUpperCase()} ]\n`
            teks += `${line}\n\n`
            for (const cmd of cmds) {
                teks += `${prefix}${cmd.name}\n`
            }
            teks += `\n${line}\n`
            teks += footer + '\n'
            teks += '```'

            return reply(teks)
        }

        // ─── .menu utama — button ─────────────────────────────────────────────
        const now = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour12: false,
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })

        let totalCmd = 0
        for (const cmds of Object.values(sortedCategories)) totalCmd += cmds.length

        // custom message dari .setmsg (ganti {total} jika ada)
        const senderTag = '@' + sender.split('@')[0]

        const customMsg = config.menuMsg
            ? config.menuMsg
                .replace(/\\n/g, '\n')
                .replace(/\+total/g, totalCmd)
                .replace(/\+baileys/g, config.baileysVersion || '@elrayyxml/baileys')
                .replace(/\+prefix/g, prefix)
                .replace(/\+waktu/g, now)
                .replace(/\+botname/g, config.botName)
                .replace(/\+owner/g, config.ownerName)
                .replace(/\+tag/g, senderTag)
            : ''

        const caption = customMsg ? customMsg : `*[ ${config.botName} ]*\n${line}\nPrefix  : ${prefix}\nWaktu   : ${now}\nTotal   : ${totalCmd} perintah\n${line}`

        const response = {
            ...(config.menuThumbnail ? {
                product: {
                    productImage: { url: config.menuThumbnail },
                    title: config.botName,
                    productId: config.botName.replace(/\s+/g, '_').toLowerCase(),
                    productImageCount: 1
                },
                businessOwnerJid: `${config.ownerNumber}@s.whatsapp.net`,
            } : {}),
            caption,
            footer,
            header: footer,
            mentions: [sender],
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Pilih Kategori',
                            sections: Object.entries(sortedCategories).map(([cat, cmds]) => ({
                                rows: [{
                                    title: cat.charAt(0).toUpperCase() + cat.slice(1),
                                    description: `${cmds.length} perintah`,
                                    id: `${prefix}menu ${cat}`
                                }]
                            })),
                            has_multiple_buttons: true
                        })
                    }
                ],
                messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        list_title: 'Pilih Kategori',
                        button_title: 'Menu'
                    }
                })
            }
        }

        await sock.sendMessage(jid, response, { quoted: m })

        // ─── Kirim audio jika di-set owner ───────────────────────────────────
        if (config.menuAudio) {
            try {
                await sock.sendMessage(jid, {
                    audio: { url: config.menuAudio },
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                })
            } catch {}
        }
    }
}
