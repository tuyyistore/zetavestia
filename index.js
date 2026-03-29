import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, downloadMediaMessage } from '@elrayyxml/baileys'
import pino from 'pino'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { readdir, copyFile, mkdir, writeFile, readFile, appendFile } from 'fs/promises'
import { existsSync } from 'fs'
import config from './config.js'

const logger = pino({ level: 'silent' })

// ─── Improved Logging (console + file bot.log) ───────────────────────────────
async function fileLog(type, msg) {
    const time = new Date().toISOString()
    const logText = `[${time}] [${type}] ${msg}\n`
    console.log(`[${time.split('T')[1].slice(0, 8)}] [${type}] ${msg}`)
    await appendFile('bot.log', logText).catch(() => {})
}

function log(type, msg) {
    fileLog(type, msg)
}

let sock
const plugins = new Map()
const antilinkGroups = new Set()
const cooldowns = new Map()
const lidMap = new Map()
const groupCache = new Map()
const spamTracker = new Map()

// ─── Load/Save data persistent ───────────────────────────────────────────────
const dataFile = './data.json'

async function loadData() {
    try {
        const raw = await readFile(dataFile, 'utf-8')
        const data = JSON.parse(raw)
        if (data.antilink) data.antilink.forEach(jid => antilinkGroups.add(jid))
        if (data.prefix) config.prefix = data.prefix
        if (data.botName) config.botName = data.botName
        if (data.ownerName) config.ownerName = data.ownerName
        if (data.footer) config.footer = data.footer
        if (data.menuAudio) config.menuAudio = data.menuAudio
        if (data.menuMsg !== undefined) config.menuMsg = data.menuMsg
        if (data.maintenance !== undefined) config.maintenance = data.maintenance
        if (data.blacklist) config.blacklist = data.blacklist
        if (data.whitelistMode !== undefined) config.whitelistMode = data.whitelistMode
        if (data.whitelistGroups) config.whitelistGroups = data.whitelistGroups
    } catch (e) {
        log('ERR', 'loadData: ' + e.message)
    }
}

async function saveData() {
    const data = {
        antilink: [...antilinkGroups],
        prefix: config.prefix,
        botName: config.botName,
        ownerName: config.ownerName,
        footer: config.footer,
        menuAudio: config.menuAudio || '',
        menuMsg: config.menuMsg || '',
        maintenance: config.maintenance || false,
        blacklist: config.blacklist || [],
        whitelistMode: config.whitelistMode || false,
        whitelistGroups: config.whitelistGroups || [],
    }
    await writeFile(dataFile, JSON.stringify(data, null, 2)).catch(e => log('ERR', 'saveData: ' + e.message))
}

// ─── Backup session ───────────────────────────────────────────────────────────
async function backupSession() {
    const src = config.sessionName
    const dst = config.sessionName + '_backup'
    if (!existsSync(src)) return
    try {
        await mkdir(dst, { recursive: true })
        const files = await readdir(src)
        for (const f of files) {
            await copyFile(join(src, f), join(dst, f))
        }
        log('BACKUP', 'Session berhasil di-backup')
    } catch (e) {
        log('ERR', 'backupSession: ' + e.message)
    }
}

// ─── Load Plugins ─────────────────────────────────────────────────────────────
async function loadPlugins() {
    plugins.clear()
    const pluginDir = join(process.cwd(), 'plugins')
    try {
        const files = await readdir(pluginDir)
        for (const file of files) {
            if (!file.endsWith('.js')) continue
            try {
                const url = pathToFileURL(join(process.cwd(), 'plugins', file)).href + '?t=' + Date.now()
                const mod = await import(url)
                const cmds = Array.isArray(mod.default) ? mod.default : [mod.default]
                for (const cmd of cmds) {
                    if (!cmd?.name) continue
                    plugins.set(cmd.name.toLowerCase(), cmd)
                    if (cmd.alias && Array.isArray(cmd.alias)) {
                        cmd.alias.forEach(a => plugins.set(a.toLowerCase(), cmd))
                    }
                    log('PLUGIN', 'loaded: ' + cmd.name)
                }
            } catch (e) {
                log('ERR', `gagal load ${file}: ${e.message}`)
            }
        }
        log('PLUGIN', `total plugin: ${new Set([...plugins.values()]).size}`)
    } catch (e) {
        log('ERR', 'folder plugins tidak ditemukan: ' + e.message)
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBody(m) {
    const msg = m.message
    if (!msg) return ''
    if (msg.conversation) return msg.conversation
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
    if (msg.imageMessage?.caption) return msg.imageMessage.caption
    if (msg.videoMessage?.caption) return msg.videoMessage.caption
    if (msg.interactiveResponseMessage) {
        const flow = msg.interactiveResponseMessage.nativeFlowResponseMessage
        if (flow?.paramsJson) {
            try { return JSON.parse(flow.paramsJson).id || '' } catch {}
        }
    }
    if (msg.listResponseMessage) return msg.listResponseMessage.singleSelectReply?.selectedRowId || ''
    if (msg.buttonsResponseMessage) return msg.buttonsResponseMessage.selectedButtonId || ''
    return ''
}

function getSender(m) {
    if (m.key.fromMe) return sock?.user?.id || ''
    const raw = m.key.participant || m.participant || m.key.remoteJid || ''
    return raw.replace(/:\d+@/, '@')
}

function resolveLid(jid) {
    if (!jid.endsWith('@lid')) return jid
    return lidMap.get(jid) || jid
}

function normJid(jid = '') {
    return jid.replace(/:\d+@/, '@').split('@')[0]
}

function checkOwner(sender) {
    const senderNorm = sender.replace(/:\d+@/, '@')
    const lids = Array.isArray(config.ownerLid) ? config.ownerLid : [config.ownerLid].filter(Boolean)
    if (lids.some(l => l.replace(/:\d+@/, '@') === senderNorm)) return true
    const resolved = resolveLid(senderNorm).replace(/:\d+@/, '@')
    if (lids.some(l => l.replace(/:\d+@/, '@') === resolved)) return true
    const num = normJid(senderNorm).replace(/[^0-9]/g, '')
    if (!num) return false
    const ownerNums = Array.isArray(config.ownerNumber)
        ? config.ownerNumber.map(n => n.replace(/[^0-9]/g, ''))
        : [config.ownerNumber.replace(/[^0-9]/g, '')]
    return ownerNums.some(o => o && (num === o || num.endsWith(o) || o.endsWith(num)))
}

async function getGroupMeta(jid) {
    const cached = groupCache.get(jid)
    const now = Date.now()
    if (cached && now - cached.ts < 2 * 60 * 1000) return cached.meta
    try {
        const meta = await sock.groupMetadata(jid)
        groupCache.set(jid, { meta, ts: now })
        return meta
    } catch (e) {
        log('ERR', `getGroupMeta ${jid}: ${e.message}`)
        return null
    }
}

async function isGroupAdmin(jid, sender) {
    try {
        const meta = await getGroupMeta(jid)
        if (!meta) return false
        const participant = meta.participants.find(part => {
            const pid = part.id.split(':')[0] + '@s.whatsapp.net'
            return part.id === sender || pid === sender
        })
        return participant?.admin === 'admin' || participant?.admin === 'superadmin'
    } catch (e) {
        log('ERR', `isGroupAdmin: ${e.message}`)
        return false
    }
}

async function getImageBuffer(m) {
    const msg = m.message
    const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const target = msg?.imageMessage ? m : quoted?.imageMessage ? { key: { ...m.key }, message: quoted } : null
    if (!target) return null
    try {
        return await downloadMediaMessage(target, 'buffer', {})
    } catch (e) {
        log('ERR', `getImageBuffer: ${e.message}`)
        return null
    }
}

function containsLink(text) {
    return /https?:\/\/|www\.|chat\.whatsapp\.com/i.test(text)
}

async function isBotAdmin(jid) {
    try {
        const meta = await getGroupMeta(jid)
        if (!meta) return false
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
        const me = meta.participants.find(p => p.id === botId)
        return me?.admin === 'admin' || me?.admin === 'superadmin'
    } catch (e) {
        log('ERR', `isBotAdmin: ${e.message}`)
        return false
    }
}

function checkCooldown(sender, command) {
    const key = sender + ':' + command
    const now = Date.now()
    const last = cooldowns.get(key) || 0
    if (now - last < 5000) return false
    cooldowns.set(key, now)
    return true
}

// ─── Restart Bot ─────────────────────────────────────────────────────────────
async function restartBot() {
    try {
        if (sock) {
            sock.ev.removeAllListeners()
            sock.end()
        }
    } catch (e) {
        log('ERR', 'restartBot: ' + e.message)
    }
    await new Promise(r => setTimeout(r, 2000))
    await startBot()
}

// ─── Start Bot ────────────────────────────────────────────────────────────────
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: !config.usePairingCode,   // QR hanya aktif kalau usePairingCode: false
        auth: state,
        browser: ['Ubuntu', 'Chrome', '22.0.0'],
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 10_000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        getMessage: async () => ({ conversation: '' }),
    })

    sock.ev.on('creds.update', saveCreds)

    // ─── Pairing Code ──────────────────────────────────────────────────────────
    if (config.usePairingCode && !state.creds.registered) {
        setTimeout(async () => {
            try {
                const phone = config.phoneNumber.replace(/[^0-9]/g, '')
                const code = await sock.requestPairingCode(phone)
                log('PAIR', `Pairing Code kamu: ${code}`)
                console.log(`\n┌──────────────────────────────┐`)
                console.log(`│  PAIRING CODE : ${code}  │`)
                console.log(`└──────────────────────────────┘\n`)
            } catch (e) {
                log('ERR', 'Gagal request pairing code: ' + e.message)
            }
        }, 3000)
    }

    sock.ev.on('contacts.upsert', (contacts) => {
        for (const c of contacts) {
            if (c.lid && c.id) lidMap.set(c.lid, c.id)
        }
    })

    sock.ev.on('contacts.update', (updates) => {
        for (const c of updates) {
            if (c.lid && c.id) lidMap.set(c.lid, c.id)
        }
    })

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr && !config.usePairingCode) log('QR', 'Scan QR di terminal')
        if (connection === 'open') {
            log('BOT', config.botName + ' terhubung')
            await backupSession()
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            const reconnect = code !== DisconnectReason.loggedOut
            log('CONN', `Koneksi putus (${code}). Reconnect: ${reconnect}`)
            if (reconnect) setTimeout(restartBot, 5000)
            else log('BOT', 'Logged out. Hapus folder session dan restart.')
        }
    })

    sock.ev.on('messages.upsert', async (data) => {
        try {
            const m = data.messages[0]
            if (!m.message || m.key.fromMe) return

            const jid = m.key.remoteJid
            const sender = getSender(m)
            const body = getBody(m)
            const isGroup = jid.endsWith('@g.us')
            const isOwnerSender = checkOwner(sender)
            
            if (body.startsWith('.sf ') || body.startsWith('.gf ') || body.startsWith('.df ')) {
    const fs = await import('fs')
    const args = body.trim().split(' ')
    const cmd = args[0].slice(1)
    const file = args[1]

    if (!file) {
        await sock.sendMessage(jid, { text: '❌ Nama file?' }, { quoted: m })
        return
    }

    if (cmd === 'gf') {
        if (!fs.existsSync(file)) {
            await sock.sendMessage(jid, { text: '❌ File tidak ada' }, { quoted: m })
            return
        }
        const data = fs.readFileSync(file, 'utf8')
        await sock.sendMessage(jid, { text: data }, { quoted: m })
        return
    }

    if (cmd === 'sf') {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

        const content =
            quoted?.conversation ||
            quoted?.extendedTextMessage?.text ||
            quoted?.imageMessage?.caption ||
            quoted?.videoMessage?.caption ||
            ''

        if (!content) {
            await sock.sendMessage(jid, { text: '❌ Reply code' }, { quoted: m })
            return
        }

        fs.writeFileSync(file, content)
        await sock.sendMessage(jid, { text: '✅ Saved' }, { quoted: m })
        return
    }

    if (cmd === 'df') {
        if (!fs.existsSync(file)) {
            await sock.sendMessage(jid, { text: '❌ File tidak ada' }, { quoted: m })
            return
        }

        fs.unlinkSync(file)
        await sock.sendMessage(jid, { text: '🗑️ Deleted' }, { quoted: m })
        return
    }
}

            if (config.maintenance && !isOwnerSender) return
            if ((config.blacklist || []).includes(sender)) return
            if (isGroup && config.whitelistMode && !(config.whitelistGroups || []).includes(jid) && !isOwnerSender) return

            if (!isOwnerSender) {
                const spamKey = 'spam:' + sender
                const now = Date.now()
                const spamData = spamTracker.get(spamKey) || { count: 0, ts: now }
                if (now - spamData.ts > 5000) {
                    spamTracker.set(spamKey, { count: 1, ts: now })
                } else {
                    spamData.count++
                    if (spamData.count > 5) {
                        log('SPAM', sender.split('@')[0] + ' terdeteksi spam')
                        return
                    }
                    spamTracker.set(spamKey, spamData)
                }
            }

            if (isGroup && antilinkGroups.has(jid) && !isOwnerSender && containsLink(body)) {
                const botAdmin = await isBotAdmin(jid)
                if (botAdmin) {
                    try {
                        await sock.sendMessage(jid, { delete: m.key })
                        await sock.groupParticipantsUpdate(jid, [sender], 'remove')
                        await sock.sendMessage(jid, {
                            text: `@${sender.split('@')[0]} dikick karena mengirim link.`,
                            mentions: [sender]
                        })
                        log('ANTILINK', sender.split('@')[0] + ' dikick di ' + jid)
                    } catch (e) {
                        log('ERR', 'antilink action: ' + e.message)
                    }
                }
                return
            }

            const evalTrigger = config.evalPrefix?.find(p => body.startsWith(p))
            if (evalTrigger) {
                const handler = plugins.get('eval')
                if (handler?.exec) {
                    const evalCtx = {
                        sock, config, plugins, antilinkGroups, saveData, loadPlugins,
                        args: [], text: '', sender, jid, isOwner: isOwnerSender, isGroup,
                        isAdmin: () => isGroupAdmin(jid, sender),
                        isBotAdmin: () => isBotAdmin(jid),
                        getImageBuffer: () => getImageBuffer(m),
                        body: body.slice(evalTrigger.length).trim(),
                        reply: async (content) => sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, { quoted: m })
                    }
                    try { await handler.exec(m, evalCtx) } catch (e) { log('ERR', 'eval: ' + e.message) }
                }
                return
            }

            if (!body.startsWith(config.prefix)) return

            const args = body.slice(config.prefix.length).trim().split(/\s+/)
            const command = args.shift().toLowerCase()
            const text = args.join(' ')

            const handler = plugins.get(command)
            if (!handler?.exec) return

            if (args[0] === '-h' || args[0] === '--help') {
                const p = handler
                const line = '─────────────────────'
                const aliasStr = p.alias?.length ? p.alias.map(a => config.prefix + a).join(', ') : '-'
                const teks = '```\n' +
                    `[${config.prefix}${p.name}]\n${line}\n\n` +
                    `Deskripsi : ${p.desc || '-'}\n` +
                    `Alias     : ${aliasStr}\n` +
                    `Cara pakai: ${p.usage || config.prefix + p.name + ' ...'}\n` +
                    `Kegunaan  : ${p.info || p.desc || '-'}\n` +
                    `Kategori  : ${p.category || '-'}\n` +
                    `Update    : ${p.updated || '-'}\n` +
                    `Author    : ${p.author || 'dcodetuyyi'}\n` +
                    `${line}\n${config.footer || config.botName}\n\`\`\``
                return await sock.sendMessage(jid, { text: teks }, { quoted: m })
            }

            if (!isOwnerSender && !checkCooldown(sender, command)) return

            const ctx = {
                sock, config, plugins, antilinkGroups, saveData, loadPlugins,
                args, text, sender, jid, isOwner: isOwnerSender, isGroup,
                isAdmin: () => isGroupAdmin(jid, sender),
                isBotAdmin: () => isBotAdmin(jid),
                getImageBuffer: () => getImageBuffer(m),
                reply: async (content) => {
                    if (typeof content === 'string') return sock.sendMessage(jid, { text: content }, { quoted: m })
                    return sock.sendMessage(jid, content, { quoted: m })
                }
            }

            log('CMD', `${command} dari ${sender.split('@')[0]}`)

            try {
                await handler.exec(m, ctx)
            } catch (e) {
                log('ERR', `${command}: ${e.message}`)
                await ctx.reply('Error: ' + e.message)
            }

        } catch (e) {
            log('ERR', 'Handler utama: ' + e.message)
        }
    })
}

// ─── Jalankan Bot ─────────────────────────────────────────────────────────────
await loadData()
await loadPlugins()
await startBot()

// Backup tiap 1 jam
setInterval(backupSession, 60 * 60 * 1000)

// Cleanup tiap 10 menit
setInterval(() => {
    const now = Date.now()
    for (const [k, v] of cooldowns) if (now - v > 10000) cooldowns.delete(k)
    for (const [k, v] of groupCache) if (now - v.ts > 5 * 60 * 1000) groupCache.delete(k)
    for (const [k, v] of spamTracker) if (now - v.ts > 10000) spamTracker.delete(k)
    if (lidMap.size > 5000) {
        const keys = [...lidMap.keys()].slice(0, lidMap.size - 5000)
        keys.forEach(k => lidMap.delete(k))
    }
}, 10 * 60 * 1000)

export { loadPlugins, plugins, log }
