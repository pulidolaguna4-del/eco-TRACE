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

app.use(routes)

app.use(notFound)
app.use(errorHandler)
