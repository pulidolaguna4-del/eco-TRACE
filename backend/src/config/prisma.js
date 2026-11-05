// =========================================================
// CLIENTE DE PRISMA (ÚNICA INSTANCIA)
// =========================================================

import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
