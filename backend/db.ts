import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH ?? path.join(__dirname, 'cabin.db')
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

// Seed some initial bookings if the table is empty
const count = (db.prepare('SELECT COUNT(*) as n FROM bookings').get() as { n: number }).n
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO bookings (name, email, guests, notes, check_in, check_out)
    VALUES (@name, @email, @guests, @notes, @check_in, @check_out)
  `)
  insert.run({ name: 'Uncle Marc',    email: 'marc@family.com',   guests: 2, notes: '', check_in: '2026-04-10', check_out: '2026-04-14' })
  insert.run({ name: 'Sophie & kids', email: 'sophie@family.com', guests: 4, notes: 'Bringing the dog', check_in: '2026-05-01', check_out: '2026-05-03' })
  insert.run({ name: 'Hans',          email: 'hans@family.com',   guests: 2, notes: '', check_in: '2026-05-18', check_out: '2026-05-22' })
  insert.run({ name: 'Mia',           email: 'mia@family.com',    guests: 3, notes: 'Anniversary trip', check_in: '2026-06-05', check_out: '2026-06-09' })
}

export default db
