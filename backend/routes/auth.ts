import { Router } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/login', (req, res) => {
  const { password } = req.body
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  res.json({ token })
})

export default router
