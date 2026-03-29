import { exec } from 'child_process'

export default {
  name: 'du',
  alias: ['size'],
  desc: 'Cek ukuran folder VPS',
  category: 'owner',
  async exec(m, { reply, isOwner }) {
    if (!isOwner) return reply('Owner only') // hanya pemilik

    exec('du -sh * | sort -hr', (err, stdout, stderr) => {
      if (err) return reply('Error: ' + err.message)
      if (stderr) return reply('Error: ' + stderr)

      reply('Size folder:\n\n' + stdout)
    })
  }
}