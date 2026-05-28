import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Compass, Tv, FolderHeart, Search, Bell, User,
  Play, ThumbsUp, Share2, ChevronDown, Clock, ArrowLeft,
  X, Heart, TrendingUp, Music, Gamepad2, Trophy, LogIn, LogOut, Loader,
  Radio, Volume2
} from 'lucide-react';
import { youtubeService } from './services/youtubeApi';
import { mockChannels } from './services/youtubeMockData';
import {
  GOOGLE_CLIENT_ID,
  initGoogleAuth,
  requestGoogleLogin,
  googleLogout,
  fetchMySubscriptions,
  fetchChannelLatestVideos,
} from './services/auth';

const YT_API_KEY = import.meta.env.VITE_YT_API_KEY || '';

// ─── Componente: Tarjeta de Vídeo ────────────────────────────────
function VideoCard({ video, onClick }) {
  return (
    <div className="video-card" onClick={() => onClick(video)}>
      <div className="thumbnail-container">
        <img src={video.thumbnail} alt={video.title} className="thumbnail-img" />
        <span className="duration-badge">{video.duration}</span>
      </div>
      <div className="video-details">
        {video.channel.avatar ? (
          <img src={video.channel.avatar} alt={video.channel.name} className="channel-avatar" />
        ) : (
          <div className="channel-avatar" style={{ background: 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tv size={16} color="var(--text-muted)" />
          </div>
        )}
        <div className="video-info">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-metadata">
            {video.channel.name}
            {video.views && <span className="metadata-dot">{video.views} vistas</span>}
            {video.uploadedAt && <span className="metadata-dot">{video.uploadedAt}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Componente: Skeleton de Carga ───────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-thumbnail" />
      <div className="skeleton-row">
        <div className="skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
    </div>
  );
}

// ─── App Principal ────────────────────────────────────────────────
function App() {
  // Navegación
  const [activeTab, setActiveTab] = useState('inicio');
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Datos
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Búsqueda
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Reproductor
  const [currentVideo, setCurrentVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);

  // Likes locales
  const [likedVideos, setLikedVideos] = useState(new Set());

  // Radio en directo
  const [activeRadio, setActiveRadio] = useState(null);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const radioAudioRef = useRef(null);

  // Auth & Suscripciones
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('yt_oauth_token') || null);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = sessionStorage.getItem('yt_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [subVideos, setSubVideos] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [authError, setAuthError] = useState(null);
  const needsClientId = GOOGLE_CLIENT_ID === 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com';

  // ── Inicializar Google Auth ─────────────────────────────────
  useEffect(() => {
    if (needsClientId) return;
    try {
      initGoogleAuth(async (token) => {
        try {
          setAuthError(null);
          setAuthToken(token);
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('No se pudo obtener el perfil');
          const profile = await res.json();
          const p = {
            name: profile.name || profile.email || 'Usuario',
            avatar: profile.picture || null,
          };
          setUserProfile(p);
          sessionStorage.setItem('yt_user_profile', JSON.stringify(p));
        } catch (err) {
          console.error('[Auth] Error en callback:', err);
          setAuthError('No se pudo iniciar sesión correctamente. Inténtalo de nuevo.');
          setAuthToken(null);
          sessionStorage.removeItem('yt_oauth_token');
          sessionStorage.removeItem('yt_user_profile');
        }
      });
    } catch (err) {
      console.error('[Auth] Error al inicializar Google Auth:', err);
    }
  }, [needsClientId]);

  // ── Cargar suscripciones cuando hay token ──────────────────
  useEffect(() => {
    if (!authToken) return;
    const loadSubs = async () => {
      try {
        setIsLoadingSubs(true);
        setAuthError(null);

        // 1. Obtener lista de canales suscritos
        const subs = await fetchMySubscriptions(authToken);
        setMySubscriptions(Array.isArray(subs) ? subs : []);

        // 2. Obtener últimos vídeos de los primeros 8 canales
        const validSubs = (subs || []).slice(0, 8).filter(ch => ch && ch.id);
        const feedResults = await Promise.allSettled(
          validSubs.map(ch => fetchChannelLatestVideos(ch.id, authToken, YT_API_KEY, 3))
        );

        // 3. Filtrar solo los resultados exitosos y vídeos válidos
        const allVideos = feedResults
          .filter(r => r.status === 'fulfilled' && Array.isArray(r.value))
          .flatMap(r => r.value)
          .filter(v => v && v.id && v.title && v.thumbnail)
          .sort(() => Math.random() - 0.5);

        setSubVideos(allVideos);
      } catch (err) {
        console.error('[Subs] Error cargando suscripciones:', err);
        setAuthError('No se pudieron cargar tus suscripciones. Comprueba tu conexión.');
      } finally {
        setIsLoadingSubs(false);
      }
    };
    loadSubs();
  }, [authToken]);

  // ── Cargar Categorías ──────────────────────────────────────
  useEffect(() => {
    youtubeService.getCategories().then(setCategories);
  }, []);

  // ── Cargar Vídeos ──────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    youtubeService.getVideos(activeCategory, searchQuery)
      .then(v => { setVideos(v); setIsLoading(false); });
  }, [activeCategory, searchQuery]);

  // ── Seleccionar Vídeo ──────────────────────────────────────
  const handleSelectVideo = async (video) => {
    // Si la radio está sonando, la pausamos antes de iniciar el vídeo
    if (radioAudioRef.current) {
      radioAudioRef.current.pause();
      setIsRadioPlaying(false);
    }
    setCurrentVideo(video);
    setRelatedVideos([]);
    const details = await youtubeService.getVideoById(video.id);
    if (details) setRelatedVideos(details.related);
  };

  const handlePlayRadio = (radio) => {
    // Si pulsamos el vídeo de youtube, lo cerramos o pausamos
    setCurrentVideo(null);

    if (activeRadio && activeRadio.id === radio.id) {
      if (isRadioPlaying) {
        radioAudioRef.current.pause();
        setIsRadioPlaying(false);
      } else {
        radioAudioRef.current.play().catch(err => console.error("Error al reproducir audio:", err));
        setIsRadioPlaying(true);
      }
    } else {
      if (radioAudioRef.current) {
        radioAudioRef.current.pause();
      }
      setActiveRadio(radio);
      setIsRadioPlaying(true);

      const audio = new Audio(radio.streamUrl);
      // Quitar crossOrigin ya que los streams Icecast/Shoutcast de radio no suelen soportar CORS
      // y causan que el navegador bloquee silenciosamente el audio.
      radioAudioRef.current = audio;
      audio.play().catch(err => {
        console.error("Error al iniciar stream de radio:", err);
        setIsRadioPlaying(false);
      });
    }
  };

  useEffect(() => {
    // Limpieza al desmontar el componente
    return () => {
      if (radioAudioRef.current) {
        radioAudioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (currentVideo) {
      const el = document.querySelector('.player-overlay');
      if (el) el.scrollTop = 0;
    }
  }, [currentVideo]);

  // ── Likes ──────────────────────────────────────────────────
  const toggleLike = (videoId) => {
    setLikedVideos(prev => {
      const s = new Set(prev);
      s.has(videoId) ? s.delete(videoId) : s.add(videoId);
      return s;
    });
  };

  // ── Búsqueda ───────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setIsSearching(false);
    setActiveTab('inicio');
    setActiveCategory('Todos');
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = () => {
    googleLogout(() => {
      setAuthToken(null);
      setUserProfile(null);
      setMySubscriptions([]);
      setSubVideos([]);
      sessionStorage.removeItem('yt_oauth_token');
      sessionStorage.removeItem('yt_user_profile');
    });
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* ══════════ SIDEBAR ESCRITORIO ══════════ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <YtLogo size={28} className="sidebar-logo-icon" />
          <span className="sidebar-logo-text">YouTube</span>
        </div>

        {[
          { id: 'inicio', icon: <Home size={20} />, label: 'Inicio' },
          { id: 'explorar', icon: <Compass size={20} />, label: 'Explorar' },
          { id: 'suscripciones', icon: <Tv size={20} />, label: 'Suscripciones' },
          { id: 'radios', icon: <Radio size={20} />, label: 'Radios' },
          { id: 'biblioteca', icon: <FolderHeart size={20} />, label: 'Biblioteca' },
        ].map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.id); if (item.id === 'inicio') { setSearchQuery(''); setSearchInput(''); } }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        <div className="sidebar-section-title">Tus canales</div>
        {(authToken && mySubscriptions.length > 0 ? mySubscriptions.slice(0, 6) : Object.values(mockChannels).slice(0, 4))
          .map(ch => (
            <button key={ch.id} className="sidebar-nav-item" style={{ gap: 10 }}
              onClick={() => setActiveTab('inicio')}>
              <img
                src={ch.avatar}
                alt={ch.name}
                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                {ch.name}
              </span>
            </button>
          ))}
      </aside>

      {/* ══════════ COLUMNA PRINCIPAL ══════════ */}
      <div className="main-wrapper">

        {/* ── CABECERA ── */}
        {!isSearching && (
          <header className="app-header">
            <div className="logo-container header-logo">
              <YtLogo size={26} className="logo-icon" />
              <span className="logo-text">YouTube</span>
            </div>

            <div className="header-search-desktop">
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                    setActiveTab('inicio');
                    setActiveCategory('Todos');
                  }
                }}
              />
              {searchInput && (
                <button className="clear-search-btn" onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="header-actions">
              <button className="icon-btn" onClick={() => setIsSearching(true)} aria-label="Buscar" id="mobile-search-btn">
                <Search size={20} />
              </button>
              <button className="icon-btn" aria-label="Notificaciones">
                <Bell size={20} />
              </button>

              {authToken && userProfile ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  title={`${userProfile.name} — Toca para cerrar sesión`}
                  onClick={handleLogout}
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid var(--primary-color)' }}
                />
              ) : needsClientId ? (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                  <User size={18} />
                </div>
              ) : (
                <button
                  onClick={requestGoogleLogin}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', color: '#111', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
                >
                  <LogIn size={15} /> Entrar
                </button>
              )}
            </div>
          </header>
        )}

        {/* ── OVERLAY BÚSQUEDA ── */}
        {isSearching && (
          <div className="search-overlay">
            <form className="search-header" onSubmit={handleSearchSubmit}>
              <button type="button" className="icon-btn" onClick={() => setIsSearching(false)}>
                <ArrowLeft size={20} />
              </button>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar en YouTube..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  autoFocus
                />
                {searchInput && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchInput('')}>
                    <X size={18} />
                  </button>
                )}
              </div>
              <button type="submit" className="icon-btn">
                <Search size={20} />
              </button>
            </form>
          </div>
        )}

        {/* ══════════ CONTENIDO PRINCIPAL ══════════ */}
        <main className="main-content">

          {/* ── PESTAÑA: INICIO ── */}
          {activeTab === 'inicio' && (
            <>
              <div className="categories-bar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {searchQuery && (
                <div className="view-title-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Resultados para: <strong>"{searchQuery}"</strong>
                  </span>
                  <button onClick={() => { setSearchQuery(''); setSearchInput(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Limpiar
                  </button>
                </div>
              )}

              {/* Canalitos suscritos (Barra superior tipo Stories si está autenticado y no es búsqueda) */}
              {authToken && !searchQuery && activeCategory === 'Todos' && mySubscriptions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="view-title-banner" style={{ marginBottom: 8, paddingBottom: 0 }}>
                    <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tv size={18} color="var(--primary-color)" /> Tus canales
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: 14, padding: '10px 16px', overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', scrollbarWidth: 'none' }}>
                    {mySubscriptions.slice(0, 15).map(ch => (
                      <div key={`stories-${ch.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 56, cursor: 'pointer' }}
                        onClick={() => { setActiveTab('suscripciones'); }}>
                        <img src={ch.avatar} alt={ch.name}
                          style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
                          onError={e => { e.target.style.display = 'none'; }} />
                        <span style={{ fontSize: 10, textAlign: 'center', width: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                          {ch.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed rápido de suscripciones en portada */}
              {authToken && !searchQuery && activeCategory === 'Todos' && subVideos.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="view-title-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Radio size={18} color="var(--primary-color)" className="pulse-icon" /> Reciente de tus suscripciones
                    </h3>
                    <button onClick={() => setActiveTab('suscripciones')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Ver todo
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                    {subVideos.slice(0, 6).map((v, i) => (
                      <div key={`portada-sv-${v.id}-${i}`} style={{ minWidth: 260, width: 260, cursor: 'pointer' }} onClick={() => handleSelectVideo(v)}>
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', backgroundColor: '#121212' }}>
                          <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span className="duration-badge">{v.duration}</span>
                        </div>
                        <h4 style={{ fontSize: 13, marginTop: 8, fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3, color: 'var(--text-primary)' }}>{v.title}</h4>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{v.channel.name} • {v.uploadedAt}</p>
                      </div>
                    ))}
                  </div>
                  <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', marginTop: 20 }} />
                </div>
              )}

              <div className="view-title-banner" style={{ marginTop: 8, marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>Recomendados para ti</h3>
              </div>

              <div className="videos-grid">
                {isLoading
                  ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
                  : videos.length > 0
                    ? videos.map(v => <VideoCard key={v.id} video={v} onClick={handleSelectVideo} />)
                    : (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                        <Search size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <p>No se encontraron resultados para "{searchQuery}"</p>
                      </div>
                    )
                }
              </div>
            </>
          )}

          {/* ── PESTAÑA: EXPLORAR ── */}
          {activeTab === 'explorar' && (
            <div>
              <div className="view-title-banner">
                <h2>Explorar</h2>
                <p className="view-subtitle">Descubre las tendencias del momento</p>
              </div>
              <div className="explore-grid">
                {[
                  { label: 'Tecnología', icon: <TrendingUp size={26} color="#ff003c" />, cat: 'Tecnología' },
                  { label: 'Música', icon: <Music size={26} color="#a855f7" />, cat: 'Música' },
                  { label: 'Gaming', icon: <Gamepad2 size={26} color="#22c55e" />, cat: 'Gaming' },
                  { label: 'Deportes', icon: <Trophy size={26} color="#eab308" />, cat: 'Deportes' },
                ].map(item => (
                  <div key={item.cat} className="explore-card"
                    onClick={() => { setActiveCategory(item.cat); setActiveTab('inicio'); }}>
                    {item.icon}
                    <span className="explore-card-title">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="view-title-banner" style={{ marginTop: 8 }}>
                <h3>Vídeos Populares Hoy</h3>
              </div>
              <div className="videos-grid">
                {(isLoading ? Array(4).fill(null) : videos.slice(0, 4)).map((v, i) =>
                  v ? <VideoCard key={v.id} video={v} onClick={handleSelectVideo} /> : <SkeletonCard key={i} />
                )}
              </div>
            </div>
          )}

          {/* ── PESTAÑA: SUSCRIPCIONES ── */}
          {activeTab === 'suscripciones' && (
            <div>
              <div className="view-title-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Suscripciones</h2>
                  {authToken && userProfile && (
                    <p className="view-subtitle">Hola, {userProfile.name.split(' ')[0]} 👋</p>
                  )}
                </div>
                {authToken && (
                  <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-pill)', color: 'var(--text-secondary)', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    <LogOut size={14} /> Salir
                  </button>
                )}
              </div>

              {/* Sin sesión */}
              {!authToken && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 32px', gap: 16, textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tv size={32} color="var(--text-muted)" />
                  </div>
                  <h3 style={{ fontSize: 18 }}>Inicia sesión para ver tus suscripciones</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.5 }}>
                    Conecta tu cuenta de Google para acceder a tus canales y ver los últimos vídeos.
                  </p>
                  {needsClientId ? (
                    <div style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 320 }}>
                      ⚠️ Abre <code style={{ color: 'var(--primary-color)' }}>src/services/auth.js</code> y reemplaza <code>TU_CLIENT_ID_AQUI</code> con tu OAuth 2.0 Client ID.
                    </div>
                  ) : (
                    <button onClick={requestGoogleLogin}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', color: '#111', border: 'none', borderRadius: 24, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                      <GoogleIcon /> Iniciar sesión con Google
                    </button>
                  )}
                </div>
              )}

              {/* Cargando */}
              {authToken && isLoadingSubs && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12 }}>
                  <Loader size={28} color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Cargando tus suscripciones...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {/* Feed real */}
              {authToken && !isLoadingSubs && (
                <>
                  {mySubscriptions.length > 0 && (
                    <div style={{ display: 'flex', gap: 14, padding: '14px 16px', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', scrollbarWidth: 'none' }}>
                      {mySubscriptions.slice(0, 20).map(ch => (
                        <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 56, cursor: 'pointer' }}>
                          <img src={ch.avatar} alt={ch.name}
                            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                          <span style={{ fontSize: 10, textAlign: 'center', width: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                            {ch.name.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {subVideos.length > 0 ? (
                    <div className="videos-grid">
                      {subVideos.map((v, i) => <VideoCard key={`sv-${v.id}-${i}`} video={v} onClick={handleSelectVideo} />)}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <p>No se encontraron vídeos recientes de tus suscripciones.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PESTAÑA: RADIOS EN DIRECTO ── */}
          {activeTab === 'radios' && (
            <div style={{ paddingBottom: 30 }}>
              <div className="view-title-banner">
                <h2>Radio en Directo</h2>
                <p className="view-subtitle">Escucha tus emisoras favoritas al instante</p>
              </div>

              {/* Emisoras Grid */}
              <div className="explore-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, padding: '0 16px' }}>
                {[
                  {
                    id: 'ser',
                    name: 'Cadena SER',
                    frecuencia: '93.9 FM',
                    color: '#ffcc00',
                    textColor: '#111',
                    avatar: 'https://play-lh.googleusercontent.com/4e90c7c3mZc0cGB2b7h9o9N36xOa7Z53f1z8hL92k7tJ9b2e5a4r6a8s9d0f=s180-rw',
                    streamUrl: 'https://cadenaser.live.wms.stream.flumotion.com/cadenaser/ser.mp3'
                  },
                  {
                    id: 'cope',
                    name: 'Cadena COPE',
                    frecuencia: '99.5 FM',
                    color: '#0056a6',
                    textColor: '#fff',
                    avatar: 'https://play-lh.googleusercontent.com/yv9b2e5a4r6a8s9d0f7tJ9b2e=s180-rw', 
                    streamUrl: 'https://azurecope.es-live.stream/COPE_DIRECTO.mp3'
                  },
                  {
                    id: 'ondacero',
                    name: 'Onda Cero',
                    frecuencia: '98.0 FM',
                    color: '#4cb050',
                    textColor: '#fff',
                    avatar: 'https://play-lh.googleusercontent.com/5tJ9b2e5a4r6a8s9d0f=s180-rw',
                    streamUrl: 'https://stream.ondacero.es/live/ondacero.mp3'
                  }
                ].map(radio => {
                  const isCurrent = activeRadio && activeRadio.id === radio.id;
                  const isPlayingThis = isCurrent && isRadioPlaying;

                  return (
                    <div
                      key={radio.id}
                      onClick={() => handlePlayRadio(radio)}
                      style={{
                        background: 'var(--bg-card)',
                        border: isCurrent ? `2px solid ${radio.color}` : '1px solid var(--border-color)',
                        borderRadius: 16,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: isCurrent ? `0 8px 24px rgba(0,0,0,0.4)` : 'none',
                        transform: isCurrent ? 'scale(1.03)' : 'scale(1)'
                      }}
                      className="radio-station-card"
                    >
                      {/* Logo / Círculo identificativo */}
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: radio.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          fontWeight: '800',
                          color: radio.textColor,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {radio.name.split(' ').pop().substring(0, 4)}
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{radio.name}</h3>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>{radio.frecuencia}</span>
                      </div>

                      {/* Botón de reproducción */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isCurrent ? radio.color : 'var(--bg-pill)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isCurrent ? radio.textColor : 'var(--text-primary)',
                          transition: 'all 0.2s ease',
                          marginTop: 4
                        }}
                      >
                        {isPlayingThis ? (
                          <div className="wave-playing" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
                            <span style={{ width: 3, background: 'currentColor', animation: 'bounce-wave 0.8s ease-in-out infinite alternate', height: '100%' }} />
                            <span style={{ width: 3, background: 'currentColor', animation: 'bounce-wave 0.8s ease-in-out infinite alternate 0.2s', height: '60%' }} />
                            <span style={{ width: 3, background: 'currentColor', animation: 'bounce-wave 0.8s ease-in-out infinite alternate 0.4s', height: '80%' }} />
                          </div>
                        ) : (
                          <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
                        )}
                      </div>

                      {/* Animación del fondo */}
                      {isPlayingThis && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: `linear-gradient(90deg, transparent, ${radio.color}, transparent)`,
                          animation: 'slide-glow 2s linear infinite'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reproductor de Radio Flotante Integrado */}
              {activeRadio && (
                <div style={{
                  margin: '30px 16px 16px 16px',
                  background: 'rgba(20, 20, 20, 0.75)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 20,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: activeRadio.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: '800',
                      color: activeRadio.textColor,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}>
                      {activeRadio.name.split(' ').pop().substring(0, 4)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{activeRadio.name}</h4>
                      <span style={{ fontSize: 11, color: isRadioPlaying ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                        {isRadioPlaying ? '🔴 En directo y reproduciendo' : '⏸️ En pausa'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                      onClick={() => handlePlayRadio(activeRadio)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'white',
                        border: 'none',
                        color: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255,255,255,0.2)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {isRadioPlaying ? (
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          <span style={{ width: 4, height: 16, background: '#111', borderRadius: 2 }} />
                          <span style={{ width: 4, height: 16, background: '#111', borderRadius: 2 }} />
                        </div>
                      ) : (
                        <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Estilos locales para las animaciones */}
              <style>{`
                @keyframes bounce-wave {
                  0% { height: 30%; }
                  100% { height: 100%; }
                }
                @keyframes slide-glow {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            </div>
          )}

          {/* ── PESTAÑA: BIBLIOTECA ── */}
          {activeTab === 'biblioteca' && (
            <div style={{ paddingBottom: 20 }}>
              <div className="view-title-banner">
                <h2>Mi Biblioteca</h2>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color="var(--primary-color)" /> Recientes
                </h3>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {videos.slice(0, 4).map(v => (
                    <div key={`h-${v.id}`} style={{ minWidth: 140, cursor: 'pointer' }} onClick={() => handleSelectVideo(v)}>
                      <div style={{ position: 'relative', width: 140, height: 78, borderRadius: 8, overflow: 'hidden', backgroundColor: '#121212' }}>
                        <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span className="duration-badge">{v.duration}</span>
                      </div>
                      <p style={{ fontSize: 12, marginTop: 6, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>{v.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={18} color="var(--primary-color)" fill={likedVideos.size > 0 ? 'var(--primary-color)' : 'none'} />
                  Me gusta ({likedVideos.size})
                </h3>
                {likedVideos.size > 0 ? (
                  <div className="videos-grid">
                    {videos.filter(v => likedVideos.has(v.id)).map(v => (
                      <VideoCard key={`lk-${v.id}`} video={v} onClick={handleSelectVideo} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: 12 }}>
                    <p style={{ fontSize: 13 }}>Aún no has dado 'Me gusta' a ningún vídeo.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

        {/* ══════════ REPRODUCTOR ══════════ */}
        {currentVideo && (
          <div className="player-overlay">
            <div className="player-header">
              <button className="close-player-btn" onClick={() => setCurrentVideo(null)} aria-label="Cerrar">
                <ChevronDown size={22} />
              </button>
            </div>

            {/* Columna video + detalles */}
            <div className="player-video-column">
              <div className="video-wrapper">
                <iframe
                  key={currentVideo.id}
                  src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  className="video-player-element"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentVideo.title}
                  style={{ border: 'none' }}
                />
              </div>

              <div className="player-details">
                <h2 className="player-title">{currentVideo.title}</h2>

                <div className="player-meta-info">
                  {currentVideo.views && <span>{currentVideo.views} vistas</span>}
                  {currentVideo.uploadedAt && <><span>•</span><span>{currentVideo.uploadedAt}</span></>}
                </div>

                {/* Acciones */}
                <div className="action-buttons-row">
                  <button
                    className={`action-pill ${likedVideos.has(currentVideo.id) ? 'active' : ''}`}
                    onClick={() => toggleLike(currentVideo.id)}
                  >
                    <ThumbsUp size={16} fill={likedVideos.has(currentVideo.id) ? '#fff' : 'none'} />
                    <span>{likedVideos.has(currentVideo.id) ? 'Me gusta' : 'Dar Like'}</span>
                  </button>
                  <button className="action-pill" onClick={() => { navigator.clipboard?.writeText(`https://youtu.be/${currentVideo.youtubeId}`); }}>
                    <Share2 size={16} /><span>Compartir</span>
                  </button>
                  <button className="action-pill" onClick={() => toggleLike(currentVideo.id)}>
                    <Clock size={16} /><span>Guardar</span>
                  </button>
                </div>

                {/* Canal */}
                <div className="channel-row">
                  <div className="channel-info-block">
                    {currentVideo.channel.avatar ? (
                      <img src={currentVideo.channel.avatar} alt={currentVideo.channel.name} className="channel-avatar" />
                    ) : (
                      <div className="channel-avatar" style={{ background: 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tv size={16} />
                      </div>
                    )}
                    <div className="channel-meta">
                      <span className="channel-name">{currentVideo.channel.name}</span>
                      {currentVideo.channel.subscribers && (
                        <span className="channel-subs">{currentVideo.channel.subscribers} suscriptores</span>
                      )}
                    </div>
                  </div>
                  <button className="subscribe-btn">Suscribirse</button>
                </div>

                {/* Comentarios (si los hay) */}
                {currentVideo.comments?.length > 0 && (
                  <div className="comments-preview-box">
                    <div className="comments-header-row">
                      <span className="comments-title">Comentarios ({currentVideo.comments.length})</span>
                      <ChevronDown size={16} color="var(--text-secondary)" />
                    </div>
                    {currentVideo.comments.slice(0, 1).map(c => (
                      <div key={c.id} className="comment-card">
                        <img src={c.avatar} alt={c.author} className="comment-avatar"
                          onError={e => { e.target.style.display = 'none'; }} />
                        <div className="comment-content-block">
                          <div className="comment-author-info">
                            <span>{c.author}</span><span>•</span><span>{c.time}</span>
                          </div>
                          <p className="comment-text">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Relacionados (móvil) */}
                {relatedVideos.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: 15, marginBottom: 12, fontFamily: 'var(--font-display)' }}>Siguiente</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {relatedVideos.map(v => (
                        <div key={`rm-${v.id}`} style={{ display: 'flex', gap: 12, cursor: 'pointer' }} onClick={() => handleSelectVideo(v)}>
                          <div style={{ position: 'relative', width: 120, minWidth: 120, aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: '#121212' }}>
                            <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span className="duration-badge" style={{ bottom: 4, right: 4, padding: '1px 4px', fontSize: 9 }}>{v.duration}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: 12, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35, color: 'var(--text-primary)' }}>{v.title}</h4>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.channel.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.views}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna relacionados (escritorio) */}
            <div className="player-related-column">
              <h3 style={{ fontSize: 15, marginBottom: 14, fontFamily: 'var(--font-display)' }}>Siguiente</h3>
              {relatedVideos.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {relatedVideos.map(v => (
                  <div key={`rd-${v.id}`} style={{ display: 'flex', gap: 10, cursor: 'pointer' }} onClick={() => handleSelectVideo(v)}>
                    <div style={{ position: 'relative', width: 120, minWidth: 120, aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: '#121212' }}>
                      <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span className="duration-badge" style={{ bottom: 4, right: 4, padding: '1px 4px', fontSize: 9 }}>{v.duration}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35, color: 'var(--text-primary)' }}>{v.title}</h4>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.channel.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ BOTTOM NAV (móvil) ══════════ */}
        <nav className="bottom-nav">
          {[
            { id: 'inicio', icon: <Home size={22} />, label: 'Inicio' },
            { id: 'explorar', icon: <Compass size={22} />, label: 'Explorar' },
            { id: 'suscripciones', icon: <Tv size={22} />, label: 'Suscripciones' },
            { id: 'radios', icon: <Radio size={22} />, label: 'Radios' },
            { id: 'biblioteca', icon: <FolderHeart size={22} />, label: 'Biblioteca' },
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); if (item.id === 'inicio') { setSearchQuery(''); setSearchInput(''); } }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>{/* fin main-wrapper */}
    </div>
  );
}

// ─── SVG del logo de YouTube ──────────────────────────────────────
function YtLogo({ size = 24, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// ─── Icono de Google ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default App;
