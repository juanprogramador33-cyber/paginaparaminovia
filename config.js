/**
 * ============================================================================
 * CONFIGURACIÓN DEL REGALO DE CUMPLEAÑOS
 * ============================================================================
 * Edita los textos entre comillas ("...") para personalizar la página.
 * Busca todo lo que esté entre corchetes [ASÍ] y reemplázalo con sus datos.
 *
 * Para las fotos:
 * 1. Guarda tus fotos dentro de la carpeta "fotos/" (ej: fotos/foto-1.jpg).
 * 2. Asegúrate de que el nombre coincida con el campo "src" de abajo.
 * 3. También puedes probar fotos y textos directamente desde el botón
 *    "Personalizar vista previa" al final de la página.
 * ============================================================================
 */

window.BIRTHDAY_CONFIG = {
  // --- 1. Datos principales y nombres (placeholders) ---
  hero: {
    etiquetaSuperior: "Feliz cumpleaños, Lucesita",
    nombreElla: "Lucesita",
    tuNombre: "Juan",
    apodo: "Lucesita",
    edad: "16", // Ej: "24" (o déjalo vacío "" si prefieres no mostrar edad)
    fechaCumpleanos: "26 de Noviembre de 2026", // Ej: "25 de Noviembre de 2026"
    // Fecha en formato AAAA-MM-DD para contar días juntos (déjalo "" si no deseas contador)
    fechaInicioRelacion: "2026-03-03",
    etiquetaContador: "días compartiendo la vida contigo",
    tituloPrincipal: "Hoy celebramos el día en que el mundo se volvió más bonito: tu cumpleaños",
    subtitulo:
      "Aqui prepare una pagina para decir lo que quizas no demuestro muchas veces, lo que siento por ti incluso en el silencio, Mi niña hermosa..",
    fotoPortada: {
      emoji: "🩵",
      src: "fotos/portada.jpg",
      pieDeFoto: "",
    },
  },

  // --- 2. Nuestra historia (Línea de tiempo) ---
  historia: {
    titulo: "Nuestra historia en pequeños capítulos",
    subtitulo:
      "Cada momento contigo ha ido construyendo mi lugar favorito en el mundo.",
    hitos: [
      {
        fecha: "Marzo",
        titulo: "Cómo nos conocimos",
        descripcion:
          "Me acuerdo muchisimo que era el dia del FAS, tu me escribiste por una cancion y desde ahi nos empezamos a hablar, nunca olvidare la felicidad con la que le conte a mis amigos que estaba hablando contigo",
        foto: "fotos/hito-1.jpg",
      },
      {
        fecha: "Marzo pero finales",
        titulo: "Modelo de ONU Femenino",
        descripcion:
          "Alguien por ahi se quedo dormida en mi hombro y me hizo ponerme rojo de lo feliz que me sentia ;)",
        foto: "fotos/hito-2.jpg",
      },
      {
        fecha: "Junio",
        titulo: "Modelo ONU la merced",
        descripcion:
          "Poder tomarte de la mano en un bus creo que es una experiencia que repetiria 67 millones de veces, amo tener un amor tierno contigo",
        foto: "fotos/hito-3.jpg",
      },
      {
        fecha: "[Hoy • Tu cumpleaños]",
        titulo: "Celebrando tus [XX] años",
        descripcion:
          "Y lo mejor es que esto apenas comienza. Quiero seguir sumando capítulos, risas y aventuras a tu lado, [APODO CARIÑOSO].",
        foto: "fotos/hito-4.jpg",
      },
    ],
  },

  // --- 3. Galería de fotos ---
  // Puedes agregar o quitar objetos dentro de "fotos".
  // Categorías sugeridas: "Nosotros", "Viajes", "Citas", "Momentos"
  galeria: {
    titulo: "Nuestros recuerdos favoritos",
    subtitulo:
      "Haz clic en cualquier foto para verla en grande y leer la historia detrás de ese momento.",
    fotos: [
      {
        id: "foto-1",
        src: "fotos/foto-1.jpg",
        titulo: "[Título de la foto 1]",
        fecha: "[Fecha o lugar]",
        categoria: "Nosotros",
        nota: "[Escribe una frase bonita sobre esta foto. Ej: Ese día no paramos de reír.]",
      },
      {
        id: "foto-2",
        src: "fotos/foto-2.jpg",
        titulo: "[Título de la foto 2]",
        fecha: "[Fecha o lugar]",
        categoria: "Viajes",
        nota: "[Ej: Mi vista favorita siempre eres tú, sin importar el paisaje.]",
      },
      {
        id: "foto-3",
        src: "fotos/foto-3.jpg",
        titulo: "[Título de la foto 3]",
        fecha: "[Fecha o lugar]",
        categoria: "Citas",
        nota: "[Ej: Café, charla infinita y tus ojos brillando como siempre.]",
      },
      {
        id: "foto-4",
        src: "fotos/foto-4.jpg",
        titulo: "[Título de la foto 4]",
        fecha: "[Fecha o lugar]",
        categoria: "Momentos",
        nota: "[Ej: Una foto espontánea que resume perfectamente por qué te amo.]",
      },
      {
        id: "foto-5",
        src: "fotos/foto-5.jpg",
        titulo: "[Título de la foto 5]",
        fecha: "[Fecha o lugar]",
        categoria: "Viajes",
        nota: "[Ej: Prometo llevarte a todos los lugares que sueñas conocer.]",
      },
      {
        id: "foto-6",
        src: "fotos/foto-6.jpg",
        titulo: "[Título de la foto 6]",
        fecha: "[Fecha o lugar]",
        categoria: "Nosotros",
        nota: "[Ej: Gracias por ser mi persona favorita todos los días.]",
      },
    ],
  },

  // --- 4. Carta de cumpleaños ---
  carta: {
    titulo: "Una carta para ti en tu día",
    subtitulo: "Toca el sobre para abrirla",
    saludo: "Querida Lucesita:",
    parrafos: [
      "Hoy no es un dia normal, nonono, hoy cumple la mejor novia de la vida, y es lo mejor del año",
      "Gracias por tu sonrisa que arregla cualquier mal día, por tu forma tan única de ver el mundo, por tu paciencia, tus abrazos y por cada momento —grande o pequeño— que hemos compartido en el colegio y en cada lugar al que vamos.",
      "En este nuevo año de vida te deseo salud, paz, metas cumplidas y muchísimos motivos para sonreír. Y pase lo que pase, quiero que sepas que siempre tendrás en mí a tu compañero, tu apoyo y tu fan número uno.",
      "Mi proposito para este año, es hacerte lo mas feliz posible",
    ],
    despedida: "Con todo mi amor,",
    firma: "Juan",
  },

  // --- 5. Razones por las que te amo ---
  razones: {
    titulo: "Pequeñas razones por las que te amo",
    subtitulo: "Solo una muestra de todo lo que admiro en ti (podría seguir toda la vida).",
    lista: [
      "Tu sonrisa contagiosa capaz de iluminar hasta el día más gris.",
      "La manera en que te emocionas con las cosas pequeñas de la vida.",
      "Tus abrazos, que se sienten exactamente como llegar a casa.",
      "Lo noble, inteligente y valiente que eres frente a cada reto.",
      "Nuestras conversaciones interminables sobre cualquier tema y las risas sin sentido.",
      "La paz que siento simplemente estando en silencio contigo.",
      "Tu pelo cuando esta recogido (te ves hermosa me encantas)",
      "Porque me haz enseñado a sobrepasar las dificultades",
    ],
  },

  // --- 6. Vales de cumpleaños (Cupones interactivos que puede canjear) ---
  vales: {
    titulo: "Tus vales especiales de cumpleaños",
    subtitulo:
      "Puedes canjearlos cuando tú quieras (¡no caducan nunca!). Haz clic en un vale para activarlo.",
    cupones: [
      {
        id: "vale-cena",
        etiqueta: "Vale #01",
        titulo: "Cena en tu restaurante favorito",
        descripcion: "Tú eliges el lugar, la hora y el postre. Yo invito todo (cuando tenga plata oki?)",
      },
      {
        id: "vale-peli",
        etiqueta: "Vale #02",
        titulo: "Noche de maratón y tus snacks",
        descripcion: "Cero quejas con la película que elijas + palomitas y dulces ilimitados. (Tocaria pedir permiso)",
      },
      {
        id: "vale-masaje",
        etiqueta: "Vale #03",
        titulo: "Sesión de masajes y mimos",
        descripcion: "Para cuando tengas un día cansado y solo quieras relajarte (esto es mas complicado logisticamente, pero estoy a tu disposicion si me quieres usar de antiestres AJJAAJAJAJ).",
      },
      {
        id: "vale-escapada",
        etiqueta: "Vale #04",
        titulo: "Escapada o cita sorpresa",
        descripcion: "Un plan especial planeado al 100% para consentirte.",
      },
    ],
  },

  // --- 7. Nuestra canción y cierre ---
  cancion: {
    titulo: "La canción que me recuerda a ti",
    nombreCancion: "Spend a Lifetime",
    artista: "Jamiroquai",
    dedicatoria:
      "Jamas se me va a olvidar dedicarte este temazo y saber que eras la indicada para dedicar",
    // Pega aquí un enlace a Spotify o YouTube, o déjalo "" si no quieres enlace externo
    enlaceExterno: "https://www.youtube.com/watch?v=dwEdWXje50I",
    textoBoton: "Escuchar canción",
  },

  cierre: {
    titulo: "Feliz cumpleaños, mi amor",
    mensaje:
      "Gracias por existir y por dejarme celebrar otro año más de tu vida contigo TE AMO MUCHO, se que no soy el novio mas facil, pero sin duda, lo intento.",
    textoPie: "Hecho con muchísimo amor por tu noviecito para ti miamor",
  },
};
