import { readFile, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'

const pluginDir = join(process.cwd(), 'plugins')

function resolveFileName(name) {
    return name.endsWith('.js') ? name : name + '.js'
}

// Strip backtick code block wrapper jika ada (``` ... ```)
function stripCodeBlock(text) {
    return text
        .replace(/^```(?:js|javascript)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim()
}

// Ambil teks dari quoted message (support semua tipe)
function getQuotedText(m) {
    const ctx = m.message?.extendedTextMessage?.contextInfo
    if (!ctx) return null
    const q = ctx.quotedMessage
    if (!q) return null
    return (
        q.conversation ||
        q.extendedTextMessage?.text ||
        q.imageMessage?.caption ||
        null
    )
}

// ─── GP - Get Plugin ──────────────────────────────────────────────────────────
export const gp = {
    name: 'gp',
    alias: ['getplugin'],
    desc: 'Ambil kode plugin',
    usage: '.listplugin',
    info: 'Lihat semua plugin yang terpasang beserta kategorinya',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    usage: '.dp <nama plugin>',
    info: 'Hapus plugin secara permanen tanpa restart',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    usage: '.sp <nama> (reply kode)',
    info: 'Simpan atau update plugin dari reply pesan kode',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    usage: '.gp <nama plugin>',
    info: 'Ambil kode sumber plugin tertentu',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, isOwner, config, args }) {
        if (!isOwner) return reply(config.ownerOnly)
        if (!args[0]) return reply('Format: .gp <nama>\nContoh: .gp tt')

        const fileName = resolveFileName(args[0])
        const filePath = join(pluginDir, fileName)

        if (!existsSync(filePath)) {
            return reply(`Plugin "${fileName}" tidak ditemukan.\nCek daftar: .lp`)
        }

        try {
            const code = await readFile(filePath, 'utf-8')
            // Kirim kode mentah tanpa backtick wrapper
            await reply(code)
        } catch (e) {
            reply(`Gagal baca plugin: ${e.message}`)
        }
    }
}

// ─── SP - Save/Replace Plugin ─────────────────────────────────────────────────
// Cara pakai: Reply pesan kode → .sp <nama>
// Kode boleh dibungkus ``` ``` atau tidak, auto-strip
export const sp = {
    name: 'sp',
    alias: ['saveplugin'],
    desc: 'Simpan/replace plugin dari reply pesan kode (langsung aktif)',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, isOwner, config, args, plugins }) {
        if (!isOwner) return reply(config.ownerOnly)
        if (!args[0]) {
            return reply(
                'Format: Reply pesan kode → ketik .sp <nama>\n\n' +
                'Contoh:\n' +
                '1. Ketik .gp tt → bot kirim kode tt\n' +
                '2. Copy, edit, kirim balik ke chat\n' +
                '3. Reply pesan kode itu → ketik .sp tt'
            )
        }

        const fileName = resolveFileName(args[0])
        const filePath = join(pluginDir, fileName)
        const isNew = !existsSync(filePath)

        // Ambil kode dari reply
        const rawText = getQuotedText(m)

        if (!rawText) {
            return reply(
                '❌ Tidak ada teks di reply.\n\n' +
                'Cara:\n' +
                '1. .gp tt → salin kode yang dikirim bot\n' +
                '2. Edit kodenya\n' +
                '3. Kirim kode ke chat (boleh pakai ``` atau tidak)\n' +
                '4. Reply kode itu → ketik .sp tt'
            )
        }

        // Strip backtick wrapper otomatis
        const finalCode = stripCodeBlock(rawText)

        if (!finalCode) {
            return reply('❌ Kode kosong setelah diproses, tidak disimpan.')
        }

        try {
            await writeFile(filePath, finalCode, 'utf-8')

            // Hot reload
            const url = pathToFileURL(filePath).href + '?t=' + Date.now()
            const mod = await import(url)
            const rawExport = mod.default
            const cmds = Array.isArray(rawExport) ? rawExport : rawExport ? [rawExport] : []

            if (!cmds.length) {
                if (isNew) { try { await unlink(filePath) } catch {} }
                return reply('⚠️ File disimpan tapi tidak ada export default.\nPlugin belum aktif.')
            }

            for (const cmd of cmds) {
                if (!isNew) {
                    for (const [key, val] of plugins.entries()) {
                        if (val.name === cmd.name) plugins.delete(key)
                    }
                }
                plugins.set(cmd.name.toLowerCase(), cmd)
                if (cmd.alias && Array.isArray(cmd.alias)) {
                    cmd.alias.forEach(a => plugins.set(a.toLowerCase(), cmd))
                }
            }

            const namaList = cmds.map(c => `.${c.name}`).join(', ')
            reply(
                `${isNew ? '✅ Plugin berhasil diinstall' : '♻️ Plugin berhasil diupdate'}!\n\n` +
                `📄 File     : ${fileName}`
            )

        } catch (e) {
            if (isNew) { try { await unlink(filePath) } catch {} }
            reply(`❌ Gagal install plugin!\n\nError: ${e.message}`)
        }
    }
}

// ─── DP - Delete Plugin ───────────────────────────────────────────────────────
export const dp = {
    name: 'dp',
    alias: ['delplugin'],
    desc: 'Hapus plugin (langsung nonaktif tanpa restart)',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, isOwner, config, args, plugins }) {
        if (!isOwner) return reply(config.ownerOnly)
        if (!args[0]) return reply('Format: .dp <nama>\nContoh: .dp tt')

        const rawName = args[0].replace('.js', '')
        const fileName = rawName + '.js'
        const filePath = join(pluginDir, fileName)

        if (!existsSync(filePath)) {
            return reply(`Plugin "${fileName}" tidak ditemukan.`)
        }

        try {
            const toDelete = []
            for (const [key, val] of plugins.entries()) {
                if (val.name === rawName || key === rawName) toDelete.push([key, val.name])
            }
            const deletedCommands = [...new Set(toDelete.map(([, n]) => '.' + n))]
            for (const [key] of toDelete) plugins.delete(key)

            await unlink(filePath)

            reply(
                `🗑️ Plugin berhasil dihapus!\n\n` +
                `📄 File    : ${fileName}\n` +
                `🏷️ Command : ${deletedCommands.join(', ') || '-'}\n\n` +
                `Langsung nonaktif tanpa restart.`
            )
        } catch (e) {
            reply(`Gagal hapus plugin: ${e.message}`)
        }
    }
}

// ─── LP - List Plugin ─────────────────────────────────────────────────────────
export const listplugin = {
    name: 'listplugin',
    alias: ['lp'],
    desc: 'Lihat semua plugin terpasang',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, isOwner, config, plugins }) {
        if (!isOwner) return reply(config.ownerOnly)

        const seen = new Map()
        for (const [, cmd] of plugins.entries()) {
            if (!seen.has(cmd.name)) seen.set(cmd.name, cmd)
        }

        const byCategory = {}
        for (const [, cmd] of seen.entries()) {
            const cat = cmd.category || 'lainnya'
            if (!byCategory[cat]) byCategory[cat] = []
            byCategory[cat].push(cmd)
        }

        const catOrder = ['user', 'download', 'admin', 'owner', 'lainnya']
        const sorted = [
            ...catOrder.filter(c => byCategory[c]).map(c => [c, byCategory[c]]),
            ...Object.entries(byCategory).filter(([c]) => !catOrder.includes(c))
        ]

        let teks = '```\nDaftar Plugin\n\n'
        for (const [cat, cmds] of sorted) {
            teks += `[ ${cat.toUpperCase()} ]\n`
            cmds.forEach(cmd => {
                teks += `  ${cmd.name}`
                if (cmd.alias?.length) teks += ` | ${cmd.alias.join(' | ')}`
                teks += '\n'
            })
            teks += '\n'
        }
        teks += `Total: ${seen.size} plugin\`\`\``

        reply(teks)
    }
}

export default [gp, sp, dp, listplugin]
