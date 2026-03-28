export default {
    name: 'whoami',
    desc: 'Cek info sender (JID, status owner & admin)',
    category: 'user',

    async exec(m, { reply, sender, isOwner, isAdmin, isGroup, config }) {
        const adminStatus = isGroup ? (await isAdmin() ? 'Ya' : 'Tidak') : '-'
        await reply(
            `Sender JID  : ${sender}\n` +
            `isOwner     : ${isOwner ? 'Ya' : 'Tidak'}\n` +
            `isAdmin     : ${adminStatus}`
        )
    }
}
