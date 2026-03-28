export default {
    name: 'menu',
    alias: ['help'],
    desc: 'Tampilkan menu',

    async exec(m, { reply }) {
        const teks = 
'Menu Bot\n\n' +
'.menu   Tampilkan menu\n' +
'.ping   Cek bot\n\n' +
'Prefix : ' + '.' 

        await reply(teks)
    }
}
