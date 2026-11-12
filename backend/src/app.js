// =========================================================
// APLICACIÓN EXPRESS
// =========================================================

import cors from 'cors'
import express from 'express'

import { config } from './config/env.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'
import routes from './routes/index.js'

export const app = express()

// CORS - permitir frontend (local y túnel)
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true
  })
)

app.use(express.json())

// Fotos subidas. Los nombres son aleatorios y nosniff evita que el
// navegador interprete un archivo como otra cosa que una imagen.
app.use(
  config.archivos.rutaPublica,
  express.static(config.archivos.directorio, {
    index: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
  })
)

app.use(routes)

app.use(notFound)
app.use(errorHandler)
