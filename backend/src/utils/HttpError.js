// =========================================================
// ERROR HTTP
// =========================================================
// Equivalente a HTTPException de FastAPI. El manejador de errores
// responde { "detail": mensaje } con el código indicado, que es el
// formato que espera el frontend.

export class HttpError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : 'Error HTTP')
    this.status = status
    this.detail = detail
  }
}
