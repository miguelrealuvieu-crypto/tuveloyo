/**
 * Servicio de autenticación Google OAuth 2.0
 * Gestiona el token de acceso para llamadas a la YouTube API que requieren usuario autenticado
 * (suscripciones, historial, likes propios, etc.)
 *
 * ⚠️ Reemplaza GOOGLE_CLIENT_ID con tu OAuth 2.0 Client ID de Google Cloud Console.
 *    Formato: XXXXXXX.apps.googleusercontent.com
 */

// ─── CONFIGURACIÓN ───────────────────────────────────────────────
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// ─── Estado global del token (con persistencia en sessionStorage) ──
let _accessToken = sessionStorage.getItem('yt_oauth_token') || null;
let _tokenClient = null;
let _onTokenCallback = null;

/**
 * Inicializa el cliente de token de Google.
 * Llama a esta función una vez al arrancar la app.
 */
export function initGoogleAuth(onTokenReceived) {
  _onTokenCallback = onTokenReceived;

  // Si ya tenemos un token en sesión al arrancar, avisamos inmediatamente al callback
  if (_accessToken && _onTokenCallback) {
    setTimeout(() => _onTokenCallback(_accessToken), 100);
  }

  // Esperar a que la librería GSI esté cargada
  const init = () => {
    if (!window.google?.accounts?.oauth2) {
      setTimeout(init, 200);
      return;
    }
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          console.error('[Auth] Error al obtener token:', tokenResponse.error);
          return;
        }
        _accessToken = tokenResponse.access_token;
        sessionStorage.setItem('yt_oauth_token', _accessToken);
        if (_onTokenCallback) _onTokenCallback(_accessToken);
      },
    });
  };
  init();
}

/**
 * Solicita al usuario que inicie sesión y autorice los permisos.
 */
export function requestGoogleLogin() {
  if (!_tokenClient) {
    console.error('[Auth] Cliente de token no inicializado. ¿Falta el Client ID?');
    return;
  }
  // Permitir auto-selección o login rápido si ya se dio consentimiento anterior
  _tokenClient.requestAccessToken();
}

/**
 * Cierra la sesión revocando el token actual.
 */
export function googleLogout(onLogout) {
  if (_accessToken) {
    window.google?.accounts?.oauth2?.revoke(_accessToken, () => {
      _accessToken = null;
      sessionStorage.removeItem('yt_oauth_token');
      if (onLogout) onLogout();
    });
  } else {
    sessionStorage.removeItem('yt_oauth_token');
    if (onLogout) onLogout();
  }
}

/**
 * Devuelve el token de acceso actual (o null si no se ha iniciado sesión).
 */
export function getAccessToken() {
  return _accessToken;
}

/**
 * Indica si el usuario ha iniciado sesión.
 */
export function isLoggedIn() {
  return !!_accessToken;
}

// ─── Llamadas API con OAuth ───────────────────────────────────────

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Obtiene las suscripciones del usuario autenticado.
 * Requiere scope: youtube.readonly
 */
export async function fetchMySubscriptions(token) {
  const results = [];
  let pageToken = null;

  try {
    do {
      let url =
        `${BASE_URL}/subscriptions?part=snippet&mine=true&maxResults=50&order=alphabetical`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.error) {
        console.error('[Auth] Error en subscriptions:', data.error.message);
        break;
      }

      (data.items || []).forEach(item => {
        const s = item.snippet;
        results.push({
          id: s.resourceId?.channelId || item.id,
          name: s.title,
          avatar:
            s.thumbnails?.high?.url ||
            s.thumbnails?.default?.url ||
            '',
          description: s.description,
        });
      });

      pageToken = data.nextPageToken || null;
    } while (pageToken && results.length < 200);

    return results;
  } catch (err) {
    console.error('[Auth] Error al obtener suscripciones:', err);
    return [];
  }
}

/**
 * Obtiene los últimos vídeos subidos por un canal dado su channelId.
 */
export async function fetchChannelLatestVideos(channelId, token, apiKey, maxResults = 6) {
  try {
    // Primero obtenemos el playlist "uploads" del canal
    const channelRes = await fetch(
      `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    const channelData = await channelRes.json();
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return [];

    // Luego obtenemos los vídeos del playlist de uploads
    const playlistRes = await fetch(
      `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${maxResults}&key=${apiKey}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    const playlistData = await playlistRes.json();

    return (playlistData.items || []).map(item => {
      const s = item.snippet;
      const videoId = s.resourceId?.videoId;
      return {
        id: videoId,
        youtubeId: videoId,
        title: s.title,
        description: s.description || '',
        thumbnail:
          s.thumbnails?.high?.url ||
          s.thumbnails?.medium?.url ||
          s.thumbnails?.default?.url ||
          '',
        duration: '--:--',
        views: '',
        likes: '',
        uploadedAt: formatDate(s.publishedAt),
        category: '',
        channel: {
          id: channelId,
          name: s.channelTitle || '',
          avatar: '',
          subscribers: '',
          verified: false,
        },
        comments: [],
      };
    });
  } catch (err) {
    console.error('[Auth] Error al obtener vídeos del canal:', err);
    return [];
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600)    return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)   return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800)  return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 604800)} semanas`;
  if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} meses`;
  return `hace ${Math.floor(diff / 31536000)} años`;
}
