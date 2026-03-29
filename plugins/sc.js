export default {
    name: 'sc',
    alias: ['sourcecode', 'source'],
    desc: 'Info source code bot',
    usage: '.sc',
    info: 'Menampilkan info source code bot',
    updated: '29/03/2026',
    author: 'dcodetuyyi',
    category: 'user',

    async exec(m, { sock, jid, config }) {
        const nodeVer = process.version
        const baileys = config.baileysVersion || '@elrayyxml/baileys'
        const github  = 'https://github.com/tuyyistore/zetavestia'
        const footer  = config.footer || config.botName

        const caption =
            `✦ S C R I P T\n\n` +
            `◦ Bot Name : ${config.botName}\n` +
            `◦ Version  : v1.0.0\n` +
            `◦ Type     : Plugins\n` +
            `◦ No Enc   : 100%\n` +
            `◦ No Bug   : No Error\n` +
            `◦ Harga    : Free\n` +
            `◦ Free     : Update\n` +
            `◦ Run      : Di Panel\n\n` +
            `✦ S Y S T E M\n\n` +
            `◦ Node.js  : ${nodeVer}\n` +
            `◦ Library  : ${baileys}`

        await sock.sendMessage(jid, {
            product: {
                productImage: { url: config.menuThumbnail || 'https://files.catbox.moe/h6vcrv.jpg' },
                title: config.botName,
                productId: 'sc_zeta_vestia',
                productImageCount: 1
            },
            businessOwnerJid: `${config.ownerNumber}@s.whatsapp.net`,
            caption,
            footer,
            header: footer,
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '⭐ OPEN SOURCE CODE',
                            url: github,
                            merchant_url: github
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '👤 DEVELOPER',
                            url: 'https://github.com/tuyyistore',
                            merchant_url: 'https://github.com/tuyyistore'
                        })
                    }
                ],
                messageParamsJson: '{}'
            }
        }, { quoted: m })
    }
}