export const config = {
    botName: "Zeta Vestia",
    botNumber: "6281913824200",
    ownerNumber: "6283121214520",
    ownerLid: ["147356553085141@lid", "6283121214520@s.whatsapp.net"],
    ownerSecret: "ownerbot2026",
    ownerName: "dcodetuyyi",
    prefix: ".",
    apiKey: "tuyyisky",
    sessionName: "session",
    evalPrefix: [">", "$", "!"],

    // Koneksi: true = Pairing Code | false = QR Code
    usePairingCode: true,
    phoneNumber: "6281913824200",   // nomor WA bot (tanpa +), dipakai saat usePairingCode: true

    // Menu
    menuThumbnail: "https://files.catbox.moe/h6vcrv.jpg",  // ganti URL gambar thumbnail
    menuAudio: "",                          // URL audio yang dikirim saat .menu (opsional)
    menuMsg: "",                            // pesan kustom di menu (.setmsg untuk ubah)
    footer: "Zeta Vestia v1",               // footer di semua menumu

    // Pesan sistem
    ownerOnly: "Command ini hanya untuk owner bot.",
    adminOnly: "Command ini hanya untuk admin grup.",
    groupOnly: "Command ini hanya bisa dipakai di grup.",
    privateOnly: "Command ini hanya bisa dipakai di chat pribadi.",
}

export default config