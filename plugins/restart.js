export default {
    name: 'restart',
    alias: ['reboot'],
    desc: 'Restart bot',
    usage: '.restart',
    info: 'Restart bot secara remote',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, isOwner, config }) {
        if (!isOwner) return reply(config.ownerOnly)
        await reply('Bot akan direstart...')
        setTimeout(() => process.exit(0), 1000)
    }
}
