// Contenido del panel de la foto según el modo (login / registro).
// Fotos de Mussi Katz en Wikimedia Commons, con licencia CC0.

import fotoTransMiCable from '../../assets/ciudad-bolivar-transmicable.jpg'
import fotoLadera from '../../assets/ciudad-bolivar-ladera.jpg'

export const CONTENIDO = {
  login: {
    foto: fotoTransMiCable,
    altFoto: 'Cabinas del TransMiCable sobre las casas de colores de Ciudad Bolívar, Bogotá',
    posicionFoto: 'object-[55%_center]',
    // Las cabinas están arriba: la tarjeta va al centro
    tarjetaArriba: false,
    mensajes: [
      {
        titulo: 'Tu localidad, más verde',
        texto: 'Encuentra puntos de reciclaje, donación de ropa y residuos electrónicos verificados por la comunidad de Ciudad Bolívar.'
      },
      {
        titulo: 'Cada entrega cuenta',
        texto: 'Registra lo que reciclas o donas y mira en el dashboard de impacto cuántos kilos llevamos entre todos.'
      },
      {
        titulo: 'Propón nuevos puntos',
        texto: 'Marca un punto con tu ubicación o una dirección. Un administrador lo revisa antes de publicarlo en el mapa.'
      }
    ]
  },
  registro: {
    foto: fotoLadera,
    altFoto: 'Casas de colores en la ladera de Ciudad Bolívar con el TransMiCable al fondo',
    posicionFoto: 'object-[45%_center]',
    // Las cabinas cruzan por el centro: la tarjeta va arriba, sobre el cielo
    tarjetaArriba: true,
    mensajes: [
      {
        titulo: 'Únete a tus vecinos',
        texto: 'Crea tu cuenta para proponer puntos, registrar tus entregas y calificar los puntos que visitas.'
      },
      {
        titulo: 'Tu aporte se ve',
        texto: 'Cada entrega verificada suma a los kilos reciclados de Ciudad Bolívar en el dashboard de impacto.'
      },
      {
        titulo: 'Un mapa hecho por todos',
        texto: 'La comunidad propone, reseña y reporta: así la información del mapa se mantiene al día.'
      }
    ]
  }
}
