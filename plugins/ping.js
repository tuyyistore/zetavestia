export default {
    name: 'ping',
    alias: ['p', 'cek', 'speed'],
    desc: 'Cek kecepatan respon bot',
    usage: '.ping',
    info: 'Mengukur latensi dan uptime bot',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'user',

    async exec(m, { reply }) {
        const start = Date.now()
        await reply('mengukur...')
        const latency = Date.now() - start
        const status = latency < 200 ? 'cepat' : latency < 500 ? 'normal' : 'lambat'

        await reply(`\`\`\`\nPING RESULT\n\nLatency : ${latency}ms\nStatus  : ${status}\nUptime  : ${Math.floor(process.uptime())}s\n\`\`\``)
    }
}
