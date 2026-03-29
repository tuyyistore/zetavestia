import fs from 'fs'
import path from 'path'
import Archiver from 'adm-zip'

export default {
    name: 'backup',
    alias: ['bckp'],
    category: 'owner',
    desc: 'Backup source code',
    usage: '.backup',
    info: 'Backup source code bot menjadi file zip',
    updated: '29/03/2026',
    author: 'dcodetuyyi',

    async exec(m, ctx) {
        const { reply, sock, jid, config, sender, isOwner } = ctx

        const owners = Array.isArray(config.ownerNumber) ? config.ownerNumber : [config.ownerNumber]
        const checkManual = owners.some(nr => sender.includes(nr.replace(/[^0-9]/g, '')))
        if (!isOwner && !checkManual) return reply(config.ownerOnly)

        try {
            const zip = new Archiver()
            const zipName = `${(config.botName || 'bot').replace(/\s+/g, '_')}.zip`
            const rootDir = process.cwd()

            const exclude = [
                'node_modules',
                'package-lock.json',
                '.npm',
                '.git',
                'tmp',
                'session_backup',
                config.sessionName || 'session'
            ]

            const files = fs.readdirSync(rootDir)

            for (const file of files) {
                const fullPath = path.join(rootDir, file)
                const stats = fs.statSync(fullPath)

                if (exclude.includes(file)) continue

                if (stats.isDirectory()) {
                    zip.addLocalFolder(fullPath, file)
                } else {
                    zip.addLocalFile(fullPath)
                }
            }

            const buffer = zip.toBuffer()

            await sock.sendMessage(jid, {
                document: buffer,
                mimetype: 'application/zip',
                fileName: zipName,
                caption: `Backup Selesai: ${zipName}`
            }, { quoted: m })

        } catch (e) {
            reply('Gagal: ' + e.message)
        }
    }
}