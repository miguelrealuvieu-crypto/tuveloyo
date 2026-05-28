import { mockCategories } from './youtubeMockData';

// ─── Configuración ───────────────────────────────────────────────
const USE_MOCK_DATA = false; // false = API de YouTube real
const API_KEY = import.meta.env.VITE_YT_API_KEY || '';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const REGION_CODE = 'ES'; // Ajusta según tu país (ES = España, MX = México, US = EE.UU.)
const MAX_RESULTS = 16;

// ─── Mapeo de categoría → ID de categoría YouTube ────────────────
const CATEGORY_ID_MAP = {
  'Tecnología':    '28',
  'Música':        '10',
  'Viajes':        '19',
  'Gaming':        '20',
  'Deportes':      '17',
  'Desarrollo Web': '28', // Ciencia y Tecnología
};

// ─── Utilidades ───────────────────────────────────────────────────

/**
 * Formatea la duración ISO 8601 (PT4M13S) a formato legible (4:13)
 */
function formatDuration(iso) {
  if (!iso) return '0:00';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Formatea el número de vistas a formato compacto (1234567 → 1.2 M)
 */
function formatViews(n) {
  const num = parseInt(n || 0);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)} K`;
  return num.toString();
}

/**
 * Formatea la fecha de publicación a texto relativo
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000; // segundos
  if (diff < 3600)   return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 604800)} semanas`;
  if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} meses`;
  return `hace ${Math.floor(diff / 31536000)} años`;
}

/**
 * Convierte un ítem de snippet de YouTube al formato de nuestra app
 */
function mapSnippetToVideo(item, contentDetails = null, statistics = null) {
  const snippet = item.snippet || {};
  const videoId = item.id?.videoId || item.id;

  return {
    id: videoId,
    youtubeId: videoId,
    title: snippet.title || 'Sin título',
    description: snippet.description || '',
    thumbnail:
      snippet.thumbnails?.maxres?.url ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      '',
    duration: contentDetails ? formatDuration(contentDetails.duration) : '--:--',
    views: statistics ? formatViews(statistics.viewCount) : '---',
    likes: statistics ? formatViews(statistics.likeCount) : '---',
    uploadedAt: formatDate(snippet.publishedAt),
    category: snippet.categoryId || 'General',
    channel: {
      id: snippet.channelId || '',
      name: snippet.channelTitle || 'Canal desconocido',
      avatar: '', // Se obtiene en una llamada separada si se necesita
      subscribers: '',
      verified: false,
    },
    comments: [], // Los comentarios requieren una llamada adicional
  };
}

/**
 * Dado un array de videoIds, obtiene detalles completos (duración, vistas, likes)
 */
async function fetchVideoDetails(videoIds) {
  if (!videoIds.length) return {};
  const ids = videoIds.join(',');
  const url = `${BASE_URL}/videos?part=contentDetails,statistics&id=${ids}&key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const map = {};
    (data.items || []).forEach(item => {
      map[item.id] = {
        contentDetails: item.contentDetails,
        statistics: item.statistics,
      };
    });
    return map;
  } catch {
    return {};
  }
}

// ─── Servicio Principal ───────────────────────────────────────────
export const youtubeService = {

  /**
   * Categorías para la barra superior
   */
  getCategories: async () => {
    return mockCategories; // Usamos las nuestras, más claras para el usuario
  },

  /**
   * Obtiene vídeos: trending si no hay búsqueda, o resultado de búsqueda
   */
  getVideos: async (category = 'Todos', searchQuery = '') => {
    try {
      let items = [];

      if (searchQuery) {
        // ── Búsqueda por texto ──────────────────────────────────
        const url =
          `${BASE_URL}/search?part=snippet` +
          `&type=video` +
          `&maxResults=${MAX_RESULTS}` +
          `&q=${encodeURIComponent(searchQuery)}` +
          `&regionCode=${REGION_CODE}` +
          `&relevanceLanguage=es` +
          `&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        items = data.items || [];
      } else if (category !== 'Todos') {
        // ── Filtrar por categoría (vídeos populares de esa categoría) ──
        const catId = CATEGORY_ID_MAP[category] || '';
        let url =
          `${BASE_URL}/videos?part=snippet,contentDetails,statistics` +
          `&chart=mostPopular` +
          `&maxResults=${MAX_RESULTS}` +
          `&regionCode=${REGION_CODE}` +
          `&key=${API_KEY}`;
        if (catId) url += `&videoCategoryId=${catId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        // Estos ya traen contentDetails y statistics
        return (data.items || []).map(item =>
          mapSnippetToVideo(item, item.contentDetails, item.statistics)
        );
      } else {
        // ── Tendencias globales (portada) ──────────────────────
        const url =
          `${BASE_URL}/videos?part=snippet,contentDetails,statistics` +
          `&chart=mostPopular` +
          `&maxResults=${MAX_RESULTS}` +
          `&regionCode=${REGION_CODE}` +
          `&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return (data.items || []).map(item =>
          mapSnippetToVideo(item, item.contentDetails, item.statistics)
        );
      }

      // Si llegamos aquí es por búsqueda (search no trae duration/stats)
      const videoIds = items.map(i => i.id?.videoId || i.id).filter(Boolean);
      const details = await fetchVideoDetails(videoIds);

      return items.map(item => {
        const vid = item.id?.videoId || item.id;
        const d = details[vid] || {};
        return mapSnippetToVideo(item, d.contentDetails, d.statistics);
      });

    } catch (err) {
      console.error('[youtubeService] Error al obtener vídeos:', err);
      return [];
    }
  },

  /**
   * Obtiene un vídeo específico y vídeos relacionados
   */
  getVideoById: async (videoId) => {
    try {
      // Vídeo principal con todos los detalles
      const videoUrl =
        `${BASE_URL}/videos?part=snippet,contentDetails,statistics` +
        `&id=${videoId}` +
        `&key=${API_KEY}`;
      const videoRes = await fetch(videoUrl);
      const videoData = await videoRes.json();
      if (!videoData.items?.length) return null;

      const item = videoData.items[0];
      const video = mapSnippetToVideo(item, item.contentDetails, item.statistics);

      // Vídeos relacionados (búsqueda por título del vídeo actual)
      const relatedUrl =
        `${BASE_URL}/search?part=snippet` +
        `&type=video` +
        `&maxResults=10` +
        `&relatedToVideoId=${videoId}` +
        `&key=${API_KEY}`;

      let related = [];
      try {
        const relRes = await fetch(relatedUrl);
        const relData = await relRes.json();
        if (!relData.error && relData.items?.length) {
          const relIds = relData.items.map(i => i.id?.videoId).filter(Boolean);
          const relDetails = await fetchVideoDetails(relIds);
          related = relData.items
            .filter(i => i.id?.videoId)
            .map(i => mapSnippetToVideo(i, relDetails[i.id.videoId]?.contentDetails, relDetails[i.id.videoId]?.statistics));
        }
      } catch {
        // relatedToVideoId puede estar restringido en ciertas cuentas; fallback silencioso
      }

      // Si no hay relacionados, hacemos una búsqueda por título
      if (!related.length) {
        const q = encodeURIComponent(item.snippet.title.split(' ').slice(0, 4).join(' '));
        const fallbackUrl =
          `${BASE_URL}/search?part=snippet&type=video&maxResults=8&q=${q}&key=${API_KEY}`;
        const fbRes = await fetch(fallbackUrl);
        const fbData = await fbRes.json();
        if (!fbData.error && fbData.items?.length) {
          const fbIds = fbData.items.map(i => i.id?.videoId).filter(Boolean);
          const fbDetails = await fetchVideoDetails(fbIds);
          related = fbData.items
            .filter(i => i.id?.videoId && i.id.videoId !== videoId)
            .map(i => mapSnippetToVideo(i, fbDetails[i.id.videoId]?.contentDetails, fbDetails[i.id.videoId]?.statistics));
        }
      }

      return { video, related };

    } catch (err) {
      console.error('[youtubeService] Error al obtener vídeo:', err);
      return null;
    }
  },

  /**
   * Simulación de suscripción (la suscripción real requiere OAuth)
   */
  toggleSubscribe: async () => true,

  /**
   * Simulación de like (el like real requiere OAuth)
   */
  toggleLike: async () => true,
};
