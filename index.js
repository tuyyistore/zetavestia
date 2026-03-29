import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, downloadMediaMessage } from '@elrayyxml/baileys'
import pino from 'pino'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { readdir, copyFile, mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import config from './config.js'

const logger = pino({ level: 'silent' })

let sock
const plugins = new Map()
const antilinkGroups = new Set()
const cooldowns = new Map()
const lidMap = new Map() // lid -> @s.whatsapp.net

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
    } catch {}
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
    }
    await writeFile(dataFile, JSON.stringify(data, null, 2))
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
    } catch {}
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
                if (mod.default) {
                    // Support export default array (multi-command per file)
                    const cmds = Array.isArray(mod.default) ? mod.default : [mod.default]
                    for (const cmd of cmds) {
                        plugins.set(cmd.name.toLowerCase(), cmd)
                        if (cmd.alias && Array.isArray(cmd.alias)) {
                            cmd.alias.forEach(a => plugins.set(a.toLowerCase(), cmd))
                        }
                        console.log('loaded: ' + cmd.name)
                    }
                }
            } catch (e) {
                console.log('gagal load: ' + file + ' - ' + e.message)
            }
        }
        console.log('total plugin: ' + new Set([...plugins.values()]).size)
    } catch (e) {
        console.log('folder plugins tidak ditemukan: ' + e.message)
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
    // ── Button / interactive response (nativeFlowMessage) ──────────────────
    if (msg.interactiveResponseMessage) {
        const flow = msg.interactiveResponseMessage.nativeFlowResponseMessage
        if (flow?.paramsJson) {
            try {
                const p = JSON.parse(flow.paramsJson)
                if (p.id) return p.id
            } catch {}
        }
    }
    // ── List response (single_select row id) ────────────────────────────────
    if (msg.listResponseMessage) {
        return msg.listResponseMessage.singleSelectReply?.selectedRowId || ''
    }
    // ── Buttons response (buttonId) ─────────────────────────────────────────
    if (msg.buttonsResponseMessage) {
        return msg.buttonsResponseMessage.selectedButtonId || ''
    }
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
    // cek exact match dulu (termasuk @lid)
    const lids = Array.isArray(config.ownerLid) ? config.ownerLid : [config.ownerLid].filter(Boolean)
    if (lids.some(l => l.replace(/:\d+@/, '@') === senderNorm)) return true
    // cek resolved lid
    const resolved = resolveLid(senderNorm).replace(/:\d+@/, '@')
    if (lids.some(l => l.replace(/:\d+@/, '@') === resolved)) return true
    // cek nomor
    const num = normJid(senderNorm).replace(/[^0-9]/g, '')
    if (!num) return false
    const ownerNums = Array.isArray(config.ownerNumber)
        ? config.ownerNumber.map(n => n.replace(/[^0-9]/g, ''))
        : [config.ownerNumber.replace(/[^0-9]/g, '')]
    return ownerNums.some(o => o && (num === o || num.endsWith(o) || o.endsWith(num)))
}

// Cek apakah sender adalah admin di grup
async function isGroupAdmin(jid, sender) {
    try {
        const meta = await sock.groupMetadata(jid)
        const p = meta.participants.find(p => {
            const pid = p.id.split(':')[0] + '@s.whatsapp.net'
            return p.id === sender || pid === sender
        })
        return p?.admin === 'admin' || p?.admin === 'superadmin'
    } catch { return false }
}

async function getImageBuffer(m) {
    const msg = m.message
    const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const target = msg?.imageMessage
        ? m
        : quoted?.imageMessage
            ? { key: { ...m.key }, message: quoted }
            : null
    if (!target) return null
    try {
        return await downloadMediaMessage(target, 'buffer', {})
    } catch { return null }
}

function containsLink(text) {
    return /https?:\/\/|www\.|chat\.whatsapp\.com/i.test(text)
}

// Cek apakah bot adalah admin di grup
async function isBotAdmin(jid) {
    try {
        const meta = await sock.groupMetadata(jid)
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
        const me = meta.participants.find(p => p.id === botId)
        return me?.admin === 'admin' || me?.admin === 'superadmin'
    } catch { return false }
}

// Cooldown: 3 detik per user per command
function checkCooldown(sender, command) {
    const key = sender + ':' + command
    const now = Date.now()
    const last = cooldowns.get(key) || 0
    if (now - last < 3000) return false
    cooldowns.set(key, now)
    return true
}

// Log rapi untuk panel
function log(type, msg) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false })
    console.log(`[${time}] [${type}] ${msg}`)
}

// ─── Start Bot ────────────────────────────────────────────────────────────────
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName)
    const { version } = await fetchLatestBaileysVersion()
    config.baileysVersion = '@elrayyxml/baileys'

    sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '22.0.0'],
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 10_000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        getMessage: async () => ({ conversation: '' }),
    })

    sock.ev.on('creds.update', saveCreds)

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
        if (qr) log('QR', 'Scan QR di terminal')
        if (connection === 'open') {
            log('BOT', config.botName + ' terhubung')
            await backupSession()
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            const reconnect = code !== DisconnectReason.loggedOut
            log('CONN', 'Koneksi putus (' + code + '). Reconnect: ' + reconnect)
            if (reconnect) setTimeout(startBot, 5000)
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

            // ── Anti-link ────────────────────────────────────────────────────
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
                    } catch {}
                }
                return
            }

            // ── Eval prefix ($, !!) ───────────────────────────────────────────
            const evalTrigger = config.evalPrefix?.find(p => body.startsWith(p))
            if (evalTrigger) {
                const handler = plugins.get('eval')
                if (handler?.exec) {
                    const evalCtx = {
                        sock, config, plugins, antilinkGroups, saveData,
                        args: [], text: '', sender, jid, isOwner: isOwnerSender, isGroup,
                        isAdmin: () => isGroupAdmin(jid, sender),
                        isBotAdmin: () => isBotAdmin(jid),
                        getImageBuffer: () => getImageBuffer(m),
                        body: body.slice(evalTrigger.length).trim(),
                        reply: async (content) => {
                            if (typeof content === 'string') return sock.sendMessage(jid, { text: content }, { quoted: m })
                            return sock.sendMessage(jid, content, { quoted: m })
                        }
                    }
                    try { await handler.exec(m, evalCtx) } catch (e) { log('ERR', 'eval: ' + e.message) }
                }
                return
            }

            // ── Command ───────────────────────────────────────────────────────
            if (!body.startsWith(config.prefix)) return

            const args = body.slice(config.prefix.length).trim().split(/\s+/)
            const command = args.shift().toLowerCase()
            const text = args.join(' ')

            const handler = plugins.get(command)
            if (!handler?.exec) return

            // ── Flag -h / --help ──────────────────────────────────────────────
            if (args[0] === '-h' || args[0] === '--help') {
                const p = handler
                const line = '─────────────────────'
                const aliasStr = p.alias?.length ? p.alias.map(a => config.prefix + a).join(', ') : '-'
                const teks =
                    '```\n' +
                    `[ ${config.prefix}${p.name} ]\n` +
                    `${line}\n\n` +
                    `Deskripsi : ${p.desc || '-'}\n` +
                    `Alias     : ${aliasStr}\n` +
                    `Cara pakai: ${p.usage || config.prefix + p.name + ' ...'}\n` +
                    `Kegunaan  : ${p.info || p.desc || '-'}\n` +
                    `Kategori  : ${p.category || '-'}\n` +
                    `Update    : ${p.updated || '-'}\n` +
                    `Author    : ${p.author || 'dcodetuyyi'}\n` +
                    `${line}\n` +
                    (config.footer || config.botName) + '\n' +
                    '```'
                return await sock.sendMessage(jid, { text: teks }, { quoted: m })
            }

            // Cooldown (skip untuk owner)
            if (!isOwnerSender && !checkCooldown(sender, command)) return

            const ctx = {
                sock,
                config,
                plugins,
                antilinkGroups,
                saveData,
                args,
                text,
                sender,
                jid,
                isOwner: isOwnerSender,
                isGroup,
                // isAdmin: cek apakah sender adalah admin grup (fungsi async)
                isAdmin: () => isGroupAdmin(jid, sender),
                isBotAdmin: () => isBotAdmin(jid),
                getImageBuffer: () => getImageBuffer(m),
                reply: async (content) => {
                    if (typeof content === 'string') {
                        return await sock.sendMessage(jid, { text: content }, { quoted: m })
                    }
                    return await sock.sendMessage(jid, content, { quoted: m })
                }
            }

            log('CMD', command + ' dari ' + sender.split('@')[0])

            try {
                await handler.exec(m, ctx)
            } catch (e) {
                log('ERR', command + ': ' + e.message)
                await ctx.reply('Error: ' + e.message)
            }

        } catch (e) {
            log('ERR', 'Handler: ' + e.message)
        }
    })
}

await loadData()
await loadPlugins()
startBot()

// Backup session tiap 1 jam
setInterval(backupSession, 60 * 60 * 1000)
