import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH ?? path.join(__dirname, 'cabin.db')

// Ensure the directory exists (critical on first deploy)
const dbDir = path.dirname(dbPath)
fs.mkdirSync(dbDir, { recursive: true })

logger.info({ dbPath }, 'Opening database')
const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    guests       INTEGER NOT NULL DEFAULT 1,
    notes        TEXT    DEFAULT '',
    check_in     TEXT    NOT NULL,
    check_out    TEXT    NOT NULL,
    cancel_token TEXT    UNIQUE,
    created_at   TEXT    DEFAULT (datetime('now'))
  )
`)

// Add cancel_token column to existing DBs that predate this migration
const cols = (db.prepare("PRAGMA table_info(bookings)").all() as { name: string }[]).map(c => c.name)
if (!cols.includes('cancel_token')) {
  db.exec('ALTER TABLE bookings ADD COLUMN cancel_token TEXT')
}
// Add status column — existing bookings are considered confirmed
if (!cols.includes('status')) {
  db.exec("ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed'")
}
// Add locale column — existing bookings default to English
if (!cols.includes('locale')) {
  db.exec("ALTER TABLE bookings ADD COLUMN locale TEXT NOT NULL DEFAULT 'en'")
}
// Add declined_reason column for booking history
if (!cols.includes('declined_reason')) {
  db.exec("ALTER TABLE bookings ADD COLUMN declined_reason TEXT")
}


export default db
