import os from 'os'

export default {
    name: 'status',
    alias: ['cekbot', 'botinfo', 'info'],
    desc: 'Cek status lengkap bot',
    category: 'user',

    async exec(m, { reply, sock, config }) {
        const uptime = process.uptime()
        const h = Math.floor(uptime / 3600)
        const min = Math.floor((uptime % 3600) / 60)
        const s = Math.floor(uptime % 60)

        const mem = process.memoryUsage()
        const totalRam = os.totalmem()
        const freeRam = os.freemem()
        const usedRam = totalRam - freeRam
        const mb = (b) => (b / 1024 / 1024).toFixed(1)

        const cpus = os.cpus()
        const cpuModel = cpus[0]?.model?.trim().split(' ').slice(0, 3).join(' ') || '-'
        const cpuCount = cpus.length

        const cpuUsage = process.cpuUsage()
        const cpuPct = ((cpuUsage.user + cpuUsage.system) / 1e6 / process.uptime() * 100).toFixed(1)

        let totalGrup = '-'
        try {
            const groups = await sock.groupFetchAllParticipating()
            totalGrup = Object.keys(groups).length
        } catch {}

        const teks = `\`\`\`
STATUS BOT

Bot Name  : ${config.botName}
Status    : Online
Uptime    : ${h}j ${min}m ${s}d

SISTEM
Node.js   : ${process.version}
Platform  : ${process.platform}
CPU       : ${cpuModel}
CPU Core  : ${cpuCount} core
CPU Usage : ${cpuPct}%

MEMORI
RAM Bot   : ${mb(mem.heapUsed)} MB / ${mb(mem.heapTotal)} MB
RAM Sistem: ${mb(usedRam)} MB / ${mb(totalRam)} MB

STATISTIK
Grup      : ${totalGrup} grup
\`\`\``

        await reply(teks)
    }
}
