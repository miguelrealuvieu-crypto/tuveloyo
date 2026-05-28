export const mockCategories = [
  "Todos",
  "Tecnología",
  "Música",
  "Viajes",
  "Gaming",
  "Deportes",
  "Desarrollo Web"
];

export const mockChannels = {
  "tech_world": {
    "id": "tech_world",
    "name": "TechWorld en Español",
    "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
    "subscribers": "1.2 M",
    "verified": true
  },
  "sound_vibes": {
    "id": "sound_vibes",
    "name": "SoundVibes Sessions",
    "avatar": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80",
    "subscribers": "450 K",
    "verified": false
  },
  "wanderlust": {
    "id": "wanderlust",
    "name": "Planeta Aventuras",
    "avatar": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&auto=format&fit=crop&q=80",
    "subscribers": "820 K",
    "verified": true
  },
  "pixel_gamer": {
    "id": "pixel_gamer",
    "name": "PixelGamer TV",
    "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80",
    "subscribers": "2.4 M",
    "verified": true
  },
  "fit_life": {
    "id": "fit_life",
    "name": "Vida Fit & Deporte",
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    "subscribers": "310 K",
    "verified": false
  },
  "dev_mind": {
    "id": "dev_mind",
    "name": "Código Creativo",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "subscribers": "680 K",
    "verified": true
  }
};

export const mockVideos = [
  {
    "id": "v1",
    "youtubeId": "aircAruvnKk",
    "title": "El Futuro de la Inteligencia Artificial en 2026: Todo lo que debes saber",
    "description": "Analizamos los últimos avances en inteligencia artificial, agentes autónomos y cómo afectarán a nuestro día a día y al desarrollo de software en el futuro cercano.",
    "thumbnail": "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
    "duration": "12:14",
    "views": "125 K",
    "uploadedAt": "hace 2 días",
    "category": "Tecnología",
    "channel": mockChannels["tech_world"],
    "likes": "14 K",
    "comments": [
      { "id": "c1_1", "author": "Carlos Gómez", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80", "content": "Increíble análisis. El avance de los agentes autónomos de IA es asombroso.", "likes": 420, "time": "hace 1 día" },
      { "id": "c1_2", "author": "Lucía Fernández", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80", "content": "¿Crees que sustituirá a los programadores junior pronto?", "likes": 105, "time": "hace 20 horas" },
      { "id": "c1_3", "author": "Marcos R.", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80", "content": "Me encanta el estilo visual del vídeo, ¡muy premium!", "likes": 34, "time": "hace 12 horas" }
    ]
  },
  {
    "id": "v2",
    "youtubeId": "ZbZSe6N_BXs",
    "title": "Lofi Hip Hop Mix - Beats para Relajarse y Estudiar",
    "description": "Una mezcla infinita de beats lofi perfectos para estudiar, programar o simplemente relajarte. Música de fondo para concentrarte y mantener el ritmo.",
    "thumbnail": "https://i.ytimg.com/vi/ZbZSe6N_BXs/hqdefault.jpg",
    "duration": "1:01:16",
    "views": "342 K",
    "uploadedAt": "hace 1 semana",
    "category": "Música",
    "channel": mockChannels["sound_vibes"],
    "likes": "45 K",
    "comments": [
      { "id": "c2_1", "author": "Elena M.", "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80", "content": "Esta mezcla es perfecta para programar. ¡La tengo en bucle!", "likes": 560, "time": "hace 5 días" },
      { "id": "c2_2", "author": "Juan Pedro", "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80", "content": "Directo a mi lista de reproducción.", "likes": 218, "time": "hace 3 días" }
    ]
  },
  {
    "id": "v3",
    "youtubeId": "ZOZOLt9HgCE",
    "title": "Ruta de 7 Días por Suiza: De Interlaken al Cervino en Tren",
    "description": "Guía completa de viaje para recorrer Suiza de punta a punta usando el Swiss Travel Pass. Descubrimos lagos de color turquesa y los picos más imponentes de Europa.",
    "thumbnail": "https://i.ytimg.com/vi/ZOZOLt9HgCE/hqdefault.jpg",
    "duration": "18:45",
    "views": "89 K",
    "uploadedAt": "hace 5 días",
    "category": "Viajes",
    "channel": mockChannels["wanderlust"],
    "likes": "9.8 K",
    "comments": [
      { "id": "c3_1", "author": "Roberto F.", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80", "content": "¡Qué tomas tan espectaculares! Suiza es otro planeta.", "likes": 98, "time": "hace 4 días" },
      { "id": "c3_2", "author": "Sofía Pérez", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80", "content": "¿Cuánto presupuesto aproximado se necesita para esta ruta?", "likes": 47, "time": "hace 2 días" }
    ]
  },
  {
    "id": "v4",
    "youtubeId": "dQw4w9WgXcQ",
    "title": "El Hit que Nunca Muere: El Clásico más Memorizado de la Historia",
    "description": "Un clásico absoluto de la música que todo el mundo conoce. Un tema que ha sobrevivido a décadas y sigue siendo tan fresco como siempre.",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "duration": "3:33",
    "views": "612 K",
    "uploadedAt": "hace 3 días",
    "category": "Música",
    "channel": mockChannels["sound_vibes"],
    "likes": "88 K",
    "comments": [
      { "id": "c4_1", "author": "GamerPro99", "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80", "content": "¡Ja! No me lo esperaba... pero tampoco me arrepiento.", "likes": 1200, "time": "hace 2 días" },
      { "id": "c4_2", "author": "Nacho H.", "avatar": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80", "content": "Un clásico es un clásico por algo jajaja.", "likes": 340, "time": "hace 1 día" }
    ]
  },
  {
    "id": "v5",
    "youtubeId": "oOlDewpCfZQ",
    "title": "Rutina HIIT en Casa - Quema Calorías en 20 Minutos (Sin Equipamiento)",
    "description": "Rutina de alta intensidad para hacer en casa. Ejercicios completos para activar tu metabolismo, mejorar resistencia y tonificar todo el cuerpo en poco tiempo.",
    "thumbnail": "https://i.ytimg.com/vi/oOlDewpCfZQ/hqdefault.jpg",
    "duration": "21:05",
    "views": "1.5 M",
    "uploadedAt": "hace 1 mes",
    "category": "Deportes",
    "channel": mockChannels["fit_life"],
    "likes": "120 K",
    "comments": [
      { "id": "c5_1", "author": "Maria S.", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80", "content": "Terminé exhausta pero feliz. ¡Es una rutina super completa!", "likes": 982, "time": "hace 3 semanas" },
      { "id": "c5_2", "author": "Álex", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80", "content": "Perfecta para cuando no tengo tiempo de ir al gimnasio.", "likes": 403, "time": "hace 2 semanas" }
    ]
  },
  {
    "id": "v6",
    "youtubeId": "W6NZfCO5SIk",
    "title": "JavaScript para Principiantes: Aprende a programar desde cero",
    "description": "Tutorial completo de JavaScript desde cero. Aprende variables, funciones, arrays, objetos, promesas y todo lo necesario para comenzar a programar en la web.",
    "thumbnail": "https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg",
    "duration": "48:13",
    "views": "74 K",
    "uploadedAt": "hace 4 días",
    "category": "Desarrollo Web",
    "channel": mockChannels["dev_mind"],
    "likes": "7.2 K",
    "comments": [
      { "id": "c6_1", "author": "Marta Dev", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80", "content": "¡Qué buen tutorial! Finalmente entiendo las promesas de JavaScript.", "likes": 182, "time": "hace 3 días" },
      { "id": "c6_2", "author": "David L.", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80", "content": "Excelente explicación, por fin lo entiendo al 100%.", "likes": 94, "time": "hace 2 días" }
    ]
  },
  {
    "id": "v7",
    "youtubeId": "jNQXAC9IVRw",
    "title": "El primer vídeo de YouTube - Historia de Internet",
    "description": "El primer vídeo subido a YouTube en la historia. Un hito cultural que marcó el inicio de la era del vídeo en Internet tal y como lo conocemos hoy.",
    "thumbnail": "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    "duration": "0:18",
    "views": "210 K",
    "uploadedAt": "hace 6 días",
    "category": "Tecnología",
    "channel": mockChannels["tech_world"],
    "likes": "22 K",
    "comments": [
      { "id": "c7_1", "author": "Iván Ruiz", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80", "content": "¡El comienzo de todo! Increíble que empezara así.", "likes": 88, "time": "hace 5 días" }
    ]
  },
  {
    "id": "v8",
    "youtubeId": "kJQP7kiw5Fk",
    "title": "Despacito - El fenómeno musical que conquistó el mundo",
    "description": "El vídeo musical que batió todos los récords de YouTube. Un himno del reggaetón latino que se convirtió en el vídeo más visto de la historia de internet.",
    "thumbnail": "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    "duration": "4:41",
    "views": "420 K",
    "uploadedAt": "hace 2 semanas",
    "category": "Música",
    "channel": mockChannels["sound_vibes"],
    "likes": "39 K",
    "comments": [
      { "id": "c8_1", "author": "Claudia T.", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80", "content": "¡Este tema marcó una época! Nadie puede evitar moverse al escucharlo.", "likes": 320, "time": "hace 1 semana" }
    ]
  }
];
