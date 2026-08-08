import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { verifyAuthToken } from '../auth/jwt'
import { prisma } from '../graphql/builder'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ''
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true)
      return
    }
    cb(new Error('Only image or video uploads are allowed'))
  },
})

export const uploadRouter = Router()

uploadRouter.post('/', upload.single('file'), async (req, res) => {
  try {
    const header = req.headers.authorization
    const [scheme, token] = header?.split(' ') ?? []
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const payload = verifyAuthToken(token)
    if (!payload) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'Missing file field "file"' })
      return
    }

    const mediaType = req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE'
    const mediaUrl = `/uploads/${req.file.filename}`

    res.status(201).json({
      mediaUrl,
      mediaType,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Upload failed'
    res.status(400).json({ error: message })
  }
})

export { UPLOAD_DIR }
