// =========================================================
// SERVICIO DE CORREO
// =========================================================

import nodemailer from 'nodemailer'

import { config } from '../config/env.js'
import { HttpError } from '../utils/HttpError.js'

const transporte = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  requireTLS: config.email.port !== 465, // STARTTLS, como smtplib.starttls()
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
})

function enviar({ para, asunto, texto }) {
  return transporte.sendMail({
    from: config.email.user,
    to: para,
    subject: asunto,
    text: texto
  })
}

// ---------------------------------------------------------
// Código de recuperación de contraseña
// Si falla, la petición responde 500.
// ---------------------------------------------------------
export async function enviarCorreoRecuperacion(correoDestino, codigo) {
  try {
    await enviar({
      para: correoDestino,
      asunto: 'Código de recuperación - Eco-TRACE',
      texto: `
Hola,

Recibimos una solicitud para recuperar la contraseña de tu cuenta de Eco-TRACE.

Tu código de recuperación es:

${codigo}

Este código será válido durante 24 horas.

Si tú no solicitaste recuperar tu contraseña, puedes ignorar este correo.

Saludos,

Equipo Eco-TRACE
`
    })
  } catch (error) {
    console.error('ERROR AL ENVIAR CORREO:', error.message)
    throw new HttpError(500, 'No se pudo enviar el correo de recuperación')
  }
}

// ---------------------------------------------------------
// Notificación de punto aprobado / rechazado
// Un error de correo NO deshace la aprobación o el rechazo.
// ---------------------------------------------------------
export async function enviarNotificacionPunto({
  correoDestino,
  nombreUsuario,
  nombrePunto,
  estado,
  motivoRechazo = null
}) {
  console.log('========================================')
  console.log('📧 INTENTANDO ENVIAR NOTIFICACIÓN')
  console.log('📧 DESTINATARIO:', correoDestino)
  console.log('👤 USUARIO:', nombreUsuario)
  console.log('📍 PUNTO:', nombrePunto)
  console.log('📌 ESTADO:', estado)
  if (motivoRechazo) console.log('📝 MOTIVO RECHAZO:', motivoRechazo)
  console.log('========================================')

  let asunto
  let texto

  if (estado === 'aprobado') {
    asunto = '¡Tu punto fue aprobado! - Eco-TRACE'
    texto = `
Hola ${nombreUsuario},

¡Tenemos buenas noticias!

Tu punto ecológico:

"${nombrePunto}"

ha sido APROBADO por un administrador de Eco-TRACE.

Ya puedes encontrarlo disponible en el mapa de Eco-TRACE.

Gracias por contribuir al cuidado del medio ambiente.

Saludos,

Equipo Eco-TRACE
`
  } else {
    const motivoTexto = motivoRechazo ? `\nMotivo de rechazo: ${motivoRechazo}\n` : ''
    asunto = 'Actualización sobre tu punto - Eco-TRACE'
    texto = `
Hola ${nombreUsuario},

Te informamos que tu punto ecológico:

"${nombrePunto}"

ha sido RECHAZADO por un administrador de Eco-TRACE.${motivoTexto}

Puedes revisar la información registrada y realizar una nueva propuesta si lo consideras necesario.

Gracias por contribuir a Eco-TRACE.

Saludos,

Equipo Eco-TRACE
`
  }

  try {
    await enviar({ para: correoDestino, asunto, texto })
    console.log(`Correo de notificación enviado a ${correoDestino}`)
  } catch (error) {
    console.error('ERROR AL ENVIAR NOTIFICACIÓN:', error.message)
  }
}
