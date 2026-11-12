// =========================================================
// CONTROLADOR DE USUARIOS
// =========================================================

import * as authService from '../services/auth.service.js'
import * as usuariosService from '../services/usuarios.service.js'
import * as serializar from '../utils/serializers.js'

// ---------- Autenticación ----------

export async function registrar(req, res) {
  const usuario = await authService.registrar(req.body)
  res.json(serializar.usuario(usuario))
}

export async function login(req, res) {
  const resultado = await authService.login(req.body)
  res.json({ ...resultado, usuario: serializar.usuario(resultado.usuario) })
}

// Inicia sesión o crea la cuenta con el ID token de Google
export async function loginConGoogle(req, res) {
  const resultado = await authService.loginConGoogle(req.body)
  res.json({ ...resultado, usuario: serializar.usuario(resultado.usuario) })
}

// ---------- Recuperación de contraseña ----------

export async function solicitarRecuperacion(req, res) {
  res.json(await authService.solicitarRecuperacion(req.body))
}

export async function verificarCodigo(req, res) {
  res.json(await authService.verificarCodigo(req.body))
}

export async function restablecerContrasena(req, res) {
  res.json(await authService.restablecerContrasena(req.body))
}

// ---------- Usuario autenticado ----------

export async function listar(_req, res) {
  const usuarios = await usuariosService.listar()
  res.json(usuarios.map(serializar.usuario))
}

export function obtenerMiUsuario(req, res) {
  res.json(serializar.usuario(req.usuario))
}

export async function actualizarMiPerfil(req, res) {
  const usuario = await usuariosService.actualizarPerfil(req.usuario.id, req.body)
  res.json(serializar.usuario(usuario))
}

export async function cambiarMiContrasena(req, res) {
  res.json(await usuariosService.cambiarContrasena(req.usuario, req.body))
}
