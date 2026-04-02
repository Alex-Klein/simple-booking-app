import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import logger from './logger.js'
import bookingsRouter from './routes/bookings.js'
import authRouter from './routes/auth.js'
import cancelRouter from './routes/cancel.js'
import calendarRouter from './routes/calendar.js'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }))
}

app.use(express.json())

// Trust proxy so X-Forwarded-For from nginx is used for client IPs
app.set('trust proxy', true)

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip
    logger[level]({ method: req.method, url: req.url, status: res.statusCode, ms, ip }, 'request')
  })
  next()
})

app.use('/api/auth', authRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/cancel', cancelRouter)
app.use('/api/calendar.ics', calendarRouter)

// Serve background image from data directory, falling back to default
const DEFAULT_BG = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1400&q=80'
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '../data')
app.get('/bg.jpg', (req, res) => {
  const jpeg = path.join(DATA_DIR, 'bg.jpeg')
  const jpg = path.join(DATA_DIR, 'bg.jpg')
  const customBg = fs.existsSync(jpeg) ? jpeg : fs.existsSync(jpg) ? jpg : null
  if (customBg) {
    res.sendFile(customBg)
  } else {
    res.redirect(DEFAULT_BG)
  }
})

// Serve slideshow images from data/backgrounds/
const BG_DIR = path.join(DATA_DIR, 'backgrounds')
fs.mkdirSync(BG_DIR, { recursive: true })
app.use('/backgrounds', express.static(BG_DIR))

// List available background images
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
app.get('/api/backgrounds', (_req, res) => {
  const files = fs.readdirSync(BG_DIR)
    .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
  if (files.length === 0) {
    res.json(['/bg.jpg'])
  } else {
    res.json(files.map(f => `/backgrounds/${f}`))
  }
})

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Backend started')
})
