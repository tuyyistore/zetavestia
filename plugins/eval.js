import axios from 'axios'
import util from 'util'

export default {
    name: 'eval',
    alias: ['!!'],
    category: 'owner',
    desc: 'Eksekusi kode JavaScript (owner only)',
    usage: '.eval <kode js>',
    info: 'Eksekusi kode JavaScript langsung di bot',
    updated: '29/03/2026',
    author: 'dcodetuyyi',

    async exec(m, ctx) {
        const { reply, sock, config, sender, body, isOwner } = ctx

        // Cek owner dari context index.js atau manual dari config
        const owners = Array.isArray(config.ownerNumber) ? config.ownerNumber : [config.ownerNumber]
        const checkManual = owners.some(nr => sender.includes(nr.replace(/[^0-9]/g, '')))
        
        if (!isOwner && !checkManual) {
            return reply('❌ Khusus Owner 🗿')
        }

        // Ambil kode: potong '!!' di awal
        const code = body.startsWith('!!') ? body.slice(2).trim() : body
        if (!code) return reply('❌ Masukkan kodenya.')

        try {
            // Gunakan eval dengan async wrapper
            let evaled = await eval(`(async () => { 
                try {
                    return ${code}
                } catch (e) {
                    return e.message
                }
            })()`)

            if (typeof evaled !== 'string') {
                evaled = util.inspect(evaled, { depth: 0 })
            }

            await reply('```' + evaled + '```')
        } catch (e) {
            await reply('```' + e.message + '```')
        }
    }
}