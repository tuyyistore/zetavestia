export default {
    name: 'restart',
    alias: ['reboot'],
    desc: 'Restart bot',
    category: 'owner',
    ownerOnly: true,

    async exec(m, { reply, isOwner, config }) {
        if (!isOwner) return reply(config.ownerOnly)
        await reply('Bot akan direstart...')
        setTimeout(() => process.exit(0), 1000)
    }
}
