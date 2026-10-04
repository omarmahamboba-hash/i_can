import fs from 'node:fs'
import path from 'node:path'

const candidates = [path.resolve(__dirname, '../../.env'), path.resolve(process.cwd(), '.env')]

for (const file of candidates) {
  if (fs.existsSync(file)) {
    try {
      process.loadEnvFile(file)
    } catch {
      /* ignore malformed or unreadable env files */
    }
  }
}
