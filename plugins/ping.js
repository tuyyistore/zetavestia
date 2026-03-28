export default {
    name: 'ping',
    alias: ['p', 'tes'],
    desc: 'Cek bot hidup',

    async exec(m, { reply }) {
        await reply('Bot aktif dan berjalan')
    }
}
