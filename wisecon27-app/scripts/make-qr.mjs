// Generate a QR code for the live WISEcon27 URL.
//
//   npm run qr                       → derives the GitHub Pages URL from `git remote origin`
//   npm run qr -- https://my.url/    → use an explicit URL
//
// Outputs wisecon27-qr.png (1024px) and wisecon27-qr.svg at the repo root.
import QRCode from 'qrcode'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function pagesUrlFromRemote() {
  try {
    const remote = execSync('git remote get-url origin', { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    // matches https://github.com/USER/REPO(.git) and git@github.com:USER/REPO(.git)
    const m = remote.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/)
    if (!m) return null
    const [, user, repo] = m
    return `https://${user}.github.io/${repo}/`
  } catch {
    return null
  }
}

const url = process.argv[2] || pagesUrlFromRemote()
if (!url) {
  console.error(
    'Could not determine the URL.\n' +
      'Add the GitHub remote first (git remote add origin …), or pass one explicitly:\n' +
      '  npm run qr -- https://<you>.github.io/wisecon27/',
  )
  process.exit(1)
}

const opts = { errorCorrectionLevel: 'M', margin: 2 }
const svg = await QRCode.toString(url, { ...opts, type: 'svg', width: 512 })
writeFileSync(resolve(repoRoot, 'wisecon27-qr.svg'), svg)
await QRCode.toFile(resolve(repoRoot, 'wisecon27-qr.png'), url, { ...opts, width: 1024 })

console.log('QR generated for: ' + url)
console.log('  → wisecon27-qr.png')
console.log('  → wisecon27-qr.svg')
