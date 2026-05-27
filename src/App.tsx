import React, { useState } from 'react';
import { Music, Plus, X, Sparkles, Loader2, Disc3, Flame, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Song, PersonalityProfile } from './types';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { Helmet } from 'react-helmet-async';


const loadingMessages = [
  "Membaca aura playlist lu...",
  "Menganalisis tingkat ke-galauan...",
  "Menghitung berapa kali lu skip lagu...",
  "Bertanya ke dukun musik...",
  "Mencari tau kenapa selera lu begini...",
  "Menyiapkan mental buat hasil analisis...",
  "Menyelaraskan frekuensi khodam musik lu..."
];

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [mode, setMode] = useState<'hype' | 'roast'>('hype');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingMessageIndex(0);
    }

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-spotify?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tracks?.items || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(val);
    }, 300);
  };

  const handleSelectSong = (track: any) => {
    if (songs.length >= 5) return;
    // Don't add if already added
    if (songs.some(s => s.id === track.id)) return;

    const newSong: Song = {
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', ')
    };

    setSongs([...songs, newSong]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSong = (id: string) => {
    setSongs(songs.filter(s => s.id !== id));
    // Reset profile if user alters their list after generating
    if (profile) setProfile(null);
  };

  const handleGenerate = async () => {
    if (songs.length !== 5) return;
    
    setIsLoading(true);
    setError(null);
    setProfile(null);

    try {
      const response = await fetch('/api/generate-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs: songs.map(s => ({ title: s.title, artist: s.artist })), mode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal baca vibe lo nih');
      }

      const data: PersonalityProfile = await response.json();
      setProfile(data);
      
      // Trigger subtle confetti
      confetti({
        particleCount: 50,
        spread: 60,
        colors: [data.hexColor, '#ffffff'],
        disableForReducedMotion: true,
        gravity: 0.8,
        ticks: 200,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSongs([]);
    setProfile(null);
    setError(null);
  };

  const handleShare = async () => {
    if (!resultRef.current) return;
    try {
      setIsSharing(true);
      
      // Delay slightly to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(resultRef.current, {
        cacheBust: true,
        backgroundColor: '#0a0a0a',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'vibe-check.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Vibe Check',
          text: `Cek Vibe Musik Gue hari ini! ${profile?.themeName}\n\nCobain cek vibe lu juga di App ini!`,
          files: [file],
        });
      } else {
        // Fallback to download
        const link = document.createElement('a');
        link.download = `vibe-check-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to share:', err);
      alert("Gagal membagikan hasil. Coba lagi.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#e0e0e0] font-sans relative overflow-hidden">
      <Helmet>
        {profile ? (
          <>
            <title>Cek Vibe Musik - {profile.themeName}</title>
            <meta name="description" content={`Vibe gue hari ini: ${profile.themeName}. ${profile.musicalVibe}`} />
            <meta property="og:title" content={`My Vibe Check: ${profile.themeName}`} />
            <meta property="og:description" content={`Cek vibe musik gue hari ini! Elemen inti: ${profile.traits.join(', ')}. Cobain cek selera lu juga.`} />
            <meta name="twitter:title" content={`My Vibe Check: ${profile.themeName}`} />
            <meta name="twitter:description" content={profile.musicalVibe} />
          </>
        ) : (
          <>
            <title>Cek Vibe Musik</title>
            <meta name="description" content="Pilih 5 lagu favorit lo. Intip profil kepribadian lo dari vibes musik." />
            <meta property="og:title" content="Cek Vibe Musik" />
            <meta property="og:description" content="Pilih 5 lagu favorit lo. Intip profil kepribadian lo dari vibes musik." />
          </>
        )}
      </Helmet>
      
      {/* Top Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-8 border-b border-white/10 shrink-0 z-20">
        <div className="text-[10px] tracking-[0.4em] font-bold uppercase text-white/50">Cek Vibe Musik / v1.0</div>
        {profile && (
          <div className="hidden sm:flex gap-8 text-[10px] tracking-[0.2em] font-bold uppercase">
            <span className="text-white/30 cursor-pointer hover:text-white transition-colors" onClick={handleReset}>Pilih Ulang</span>
            <span className="text-white">Analisis</span>
          </div>
        )}
      </nav>

      {/* Background Glow */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none transition-colors duration-1000"
        style={{
          background: profile 
            ? `radial-gradient(circle at 50% 50%, ${profile.hexColor} 0%, transparent 70%)`
            : 'radial-gradient(circle at 50% 50%, #ffffff 0%, transparent 70%)'
        }}
      />

      <main className="z-10 flex-1 w-full flex flex-col items-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-3xl flex flex-col gap-12">
          <header className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-serif italic leading-[0.9] text-white">
              Cek <br className="hidden md:block" /> Vibe
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-6">Pilih 5 lagu favorit lo. Intip profil kepribadian lo.</p>
          </header>

        <AnimatePresence mode="wait">
          {!profile ? (
            <motion.div 
              key="input-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              className="space-y-6"
            >
              <div className="bg-white/5 border border-white/10 p-8 md:p-12">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari lagu favorit lo di Spotify..."
                    value={searchQuery}
                    onChange={onSearchQueryChange}
                    disabled={songs.length >= 5 || isLoading}
                    className="w-full bg-transparent border-b border-white/20 pb-4 focus:outline-none focus:border-white disabled:opacity-50 transition-all placeholder:text-white/20 text-white font-serif italic text-xl md:text-2xl"
                  />
                  
                  {/* Autocomplete Results */}
                  <AnimatePresence>
                    {(searchResults.length > 0 || isSearching) && searchQuery.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-[#121212] border border-white/10 shadow-2xl z-50 max-h-80 overflow-y-auto"
                      >
                        {isSearching ? (
                          <div className="p-4 flex items-center justify-center text-white/40">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="flex flex-col">
                            {searchResults.map((track) => (
                              <button
                                key={track.id}
                                onClick={() => handleSelectSong(track)}
                                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/[0.05] last:border-none"
                              >
                                {track.album?.images?.[2]?.url && (
                                  <img 
                                    src={track.album.images[2].url} 
                                    alt="Album art" 
                                    className="w-10 h-10 object-cover rounded-sm grayscale opacity-70"
                                  />
                                )}
                                <div className="flex flex-col flex-1 overflow-hidden">
                                  <span className="font-serif italic text-white text-lg truncate block">{track.name}</span>
                                  <span className="text-[10px] uppercase tracking-widest text-white/40 truncate block mt-1">
                                    {track.artists.map((a: any) => a.name).join(', ')}
                                  </span>
                                </div>
                                <Plus className="w-4 h-4 text-white/30" />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-12 space-y-6">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 border-b border-white/10 pb-4">
                    <span>Lagu Pilihan Lo</span>
                    <span>{songs.length} / 5</span>
                  </div>
                  
                  <div className="space-y-4 min-h-[200px]">
                    <AnimatePresence>
                      {songs.length === 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full flex flex-col items-center justify-center text-white/20 space-y-4 pt-12"
                        >
                          <Music className="w-8 h-8 opacity-50" />
                          <p className="text-[10px] uppercase tracking-[0.2em]">Belum ada lagu yang lo pilih coi...</p>
                        </motion.div>
                      )}
                      {songs.map((song, index) => (
                        <motion.div
                          key={song.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start justify-between py-4 group border-b border-white/[0.05] hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start gap-6 overflow-hidden">
                            <span className="text-[10px] font-mono text-white/20 pt-2">{String(index + 1).padStart(2, '0')}</span>
                            <div className="flex flex-col truncate">
                              <span className="font-serif text-xl md:text-2xl italic leading-tight text-white truncate">{song.title}</span>
                              <span className="text-xs uppercase tracking-wider text-white/40 truncate mt-1">{song.artist}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white/40 hover:text-[#1DB954] p-2 transition-colors"
                              title="Search on Spotify"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                              </svg>
                            </a>
                            <button
                              onClick={() => handleRemoveSong(song.id)}
                              className="text-white/40 hover:text-white p-2 transition-colors"
                              aria-label="Hapus lagu"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-red-500/50 text-red-400 p-4 text-[10px] uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}

              {songs.length === 5 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex p-1 bg-[#121212] border border-white/10 w-full rounded-sm"
                >
                  <button
                    onClick={() => setMode('hype')}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] uppercase tracking-widest font-bold transition-all ${mode === 'hype' ? 'bg-white text-black' : 'text-white/40 hover:text-white/80'} disabled:opacity-50`}
                  >
                    <Sparkles className="w-4 h-4" /> Validasi (Hype)
                  </button>
                  <button
                    onClick={() => setMode('roast')}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] uppercase tracking-widest font-bold transition-all ${mode === 'roast' ? 'bg-[#ff4e00] text-white' : 'text-white/40 hover:text-[#ff4e00]'} disabled:opacity-50`}
                  >
                    <Flame className="w-4 h-4" /> Roasting Brutal
                  </button>
                </motion.div>
              )}

              <motion.button
                onClick={handleGenerate}
                disabled={songs.length !== 5 || isLoading}
                className="w-full bg-[#ff4e00] hover:bg-[#e64600] text-black p-6 font-bold text-[10px] uppercase tracking-[0.4em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 relative overflow-hidden group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <div className="relative h-4 flex items-center justify-center min-w-[300px]">
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={loadingMessageIndex}
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -15, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="absolute w-full"
                        >
                          {loadingMessages[loadingMessageIndex]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Cek Kepribadian Lo</span>
                  </>
                )}
                
                {/* Shine effect on hover */}
                {!isLoading && songs.length === 5 && (
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="result-section"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="space-y-6 flex flex-col"
            >
              <div 
                ref={resultRef}
                className="bg-[#0a0a0a] border-t border-b border-white/20 py-12 md:py-16 relative overflow-hidden flex flex-col items-center justify-center -mx-4 px-4 sm:mx-0 sm:px-0"
              >
                {/* Background Decorative Text */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] md:text-[18rem] font-serif italic opacity-[0.02] pointer-events-none select-none leading-none whitespace-nowrap"
                  style={{ color: profile.hexColor }}
                >
                  Identitas
                </div>
                
                <div className="relative z-10 w-full px-6 flex flex-col items-center text-center">
                  <span 
                    className="inline-block px-4 py-2 text-black text-[10px] font-bold uppercase tracking-[0.3em] mb-12"
                    style={{ backgroundColor: profile.hexColor }}
                  >
                    Tipe Kepribadian
                  </span>
                  
                  <h2 className="text-5xl md:text-7xl font-serif leading-[0.9] text-white mb-10 max-w-2xl px-4">
                    {profile.themeName.split(' ').map((word, i, arr) => 
                      i === arr.length - 1 ? <span key={i} className="italic block mt-3" style={{ color: profile.hexColor }}>{word}</span> : <span key={i}>{word} </span>
                    )}
                  </h2>
                  
                  <div className="max-w-2xl mx-auto space-y-12">
                    <p className="text-lg md:text-xl leading-relaxed text-white/70 font-light text-balance px-4">
                      {profile.musicalVibe}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/20 pt-12 text-left px-8 md:px-0">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: profile.hexColor }}>Elemen Inti</h4>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {profile.traits.map(trait => (
                            <span key={trait} className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] tracking-wider uppercase text-white/50">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: profile.hexColor }}>Vibe Persona</h4>
                        <div className="text-sm text-white/60 leading-relaxed font-light [&>p>strong]:text-white [&>p>strong]:font-bold [&>p>strong]:tracking-wide space-y-3">
                          <ReactMarkdown>{profile.summary}</ReactMarkdown>
                        </div>

                        {profile.metrics && profile.metrics.length > 0 && (
                          <div className="mt-8 space-y-6 border-t border-white/10 pt-8">
                            {profile.metrics.map((metric, i) => (
                              <div key={i} className="space-y-3">
                                <div className="flex justify-between text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold">
                                  <span>{metric.labelLeft}</span>
                                  <span>{metric.labelRight}</span>
                                </div>
                                <div className="h-1 bg-white/10 w-full relative group">
                                  <motion.div 
                                    className="absolute top-0 bottom-0 left-0" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.value}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + (i * 0.2) }}
                                    style={{ backgroundColor: profile.hexColor }}
                                  />
                                  <motion.div 
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#0a0a0a]"
                                    initial={{ left: 0, opacity: 0 }}
                                    animate={{ left: `calc(${metric.value}% - 6px)`, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + (i * 0.2) }}
                                    style={{ backgroundColor: profile.hexColor }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {profile.missingTrack && (
                      <div className="border border-white/20 bg-white/5 p-6 md:p-8 mt-12 relative overflow-hidden group">
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity" 
                          style={{ backgroundColor: profile.hexColor }} 
                        />
                        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                          <div className="space-y-4 max-w-xl">
                            <div className="flex items-center gap-3">
                              <Sparkles className="w-4 h-4" style={{ color: profile.hexColor }} />
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: profile.hexColor }}>The Missing Track (Lagu Ke-6)</h4>
                            </div>
                            <div>
                              <h3 className="text-2xl font-serif italic text-white mb-1 group-hover:tracking-wide transition-all">{profile.missingTrack.title}</h3>
                              <p className="text-sm uppercase tracking-widest text-white/40">{profile.missingTrack.artist}</p>
                            </div>
                            <p className="text-sm text-white/70 font-light leading-relaxed">
                              {profile.missingTrack.reason}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center justify-center">
                            <a
                              href={`https://open.spotify.com/search/${encodeURIComponent(`${profile.missingTrack.title} ${profile.missingTrack.artist}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:text-[#1DB954] hover:border-[#1DB954] transition-all bg-white/5 hover:bg-white/10"
                              title="Search on Spotify"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 w-full max-w-2xl mx-auto">
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="bg-white text-black hover:bg-white/90 px-10 py-5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  {isSharing ? 'Menyiapkan...' : 'Share Hasil'}
                </button>
                <button
                  onClick={handleReset}
                  className="bg-transparent border border-white/20 hover:border-white text-white/70 hover:text-white px-10 py-5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center"
                >
                  Cek Pilihan Lain
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Bottom Branding Bar */}
      <footer className="h-16 flex items-center px-6 md:px-12 border-t border-white/10 shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: profile ? profile.hexColor : '#ff4e00' }}></div>
          <p className="text-[10px] tracking-widest uppercase text-white/40">Analisis Selesai &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

