import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@elrayyxml/baileys'
import pino from 'pino'
import config from './config.js'
import { join } from 'path'
import { readdir } from 'fs/promises'

const logger = pino({ level: 'silent' })

let sock
const plugins = new Map()

async function loadPlugins() {
    plugins.clear()
    const pluginDir = join(process.cwd(), 'plugins')

    try {
        const files = await readdir(pluginDir)
        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    // Cara import yang lebih aman untuk Termux
                    const modPath = `./plugins/${file}`
                    const mod = await import(modPath)
                    
                    if (mod.default) {
                        const cmd = mod.default
                        plugins.set(cmd.name.toLowerCase(), cmd)
                        if (cmd.alias && Array.isArray(cmd.alias)) {
                            cmd.alias.forEach(alias => plugins.set(alias.toLowerCase(), cmd))
                        }
                        console.log('Loaded plugin: ' + cmd.name)
                    }
                } catch (e) {
                    console.log('Failed load plugin: ' + file)
                }
            }
        }
    } catch (e) {
        console.log('Folder plugins belum ada atau kosong')
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
    })

    console.log('Bot mulai')

    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
            console.log('Bot berhasil terhubung')
        }
        if (update.connection === 'close') {
            console.log('Koneksi terputus')
            setTimeout(startBot, 5000)
        }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async (data) => {
        const m = data.messages[0]
        if (!m.message || m.key.fromMe) return

        let body = ''
        if (m.message.conversation) body = m.message.conversation
        else if (m.message.extendedTextMessage && m.message.extendedTextMessage.text) body = m.message.extendedTextMessage.text

        if (!body.startsWith(config.prefix)) return

        const command = body.slice(config.prefix.length).trim().split(' ')[0].toLowerCase()

        const handler = plugins.get(command)
        if (handler && handler.exec) {
            try {
                await handler.exec(m, {
                    reply: async (text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
                })
            } catch (e) {
                console.log('Error di plugin')
            }
        }
    })
}

await loadPlugins()
startBot()
