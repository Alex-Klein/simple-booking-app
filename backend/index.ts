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

const app = express()
const PORT = 3001
const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }))
}

app.use(express.json())

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    logger[level]({ method: req.method, url: req.url, status: res.statusCode, ms }, 'request')
  })
  next()
})

app.use('/api/auth', authRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/cancel', cancelRouter)

// Serve background image from data directory, falling back to default
const DEFAULT_BG = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1400&q=80'
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '../data')
app.get('/bg.jpg', (req, res) => {
  const customBg = path.join(DATA_DIR, 'bg.jpg')
  if (fs.existsSync(customBg)) {
    res.sendFile(customBg)
  } else {
    res.redirect(DEFAULT_BG)
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
