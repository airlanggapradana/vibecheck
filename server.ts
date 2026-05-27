import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route
  let spotifyToken: string | null = null;
  let spotifyTokenExpiresAt: number = 0;

  async function getSpotifyToken() {
    if (spotifyToken && Date.now() < spotifyTokenExpiresAt) {
      return spotifyToken;
    }

    // Use environment variables or fallback to exact credentials provided by user
    const clientId = process.env.SPOTIFY_CLIENT_ID || "69b2a94e61534802867bf4839d0ee1e1";
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "d0e57fe924e346a78da3d852fe959414";

    if (!clientId || !clientSecret) {
      throw new Error("Token Spotify belum disetting di environment variables");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil token baru dari Spotify");
    }

    const data = await response.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // Buffer 60 detik

    return spotifyToken;
  }

  app.get("/api/search-spotify", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query wajib diisi" });
      }

      const token = await getSpotifyToken();

      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
           return res.status(401).json({ error: "Token Spotify expired nih. Coba update tokennya dulu." });
        }
        throw new Error("Gagal ambil data dari Spotify API");
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error searching Spotify:", error);
      res.status(500).json({ error: "Gagal nyari lagu di Spotify" });
    }
  });

  app.post("/api/generate-personality", async (req, res) => {
    try {
      const { songs, mode = 'hype' } = req.body as { songs: { title: string; artist: string }[], mode: 'hype' | 'roast' };
      
      if (!songs || songs.length !== 5) {
        return res.status(400).json({ error: "Pilih 5 lagu dulu ya biar pas." });
      }

      const songList = songs.map(s => `${s.title} by ${s.artist}`).join(", ");
      
      const modeInstruction = mode === 'roast' 
        ? "MODE ROAST MENTAL: Roasting habis-habisan selera musik mereka! Kasih komentar sarkastik, pedas, brutal, lucu, sebut selera mereka basic, red flag, sok indie, atau cringe. Pokoknya bikin mental breakdown tapi lucu banget. Gunakan bahasa gaul Jakarta/Indonesia yang luwes."
        : "MODE HYPE/VALIDASI: Puji setinggi langit selera musik mereka! Bikin mereka merasa punya selera paling keren, estetik, elit, vibes oke banget. Supportive, friendly, dan nge-hype abis. Gunakan bahasa gaul Jakarta/Indonesia yang luwes.";

      const prompt = `Lo adalah seorang psikolog musik dan analis budaya. Dari 5 lagu favorit user ini, tolong analisis selera musik dan kepribadian mereka.
      
INSTRUKSI SPESIFIK:
${modeInstruction}

Lagu-lagu:
${songList}

Berikan output JSON yang persis ngikutin struktur ini:
{
  "themeName": "Nama yang puitis/keren buat vibe ini (contoh: 'Pemimpi Malam Neon', 'Pengembara Akustik Senja')",
  "traits": ["3 sampai 5 kata sifat asik yang gambarin vibe mereka"],
  "musicalVibe": "Deskripsi 1-2 kalimat tentang 'energi' atau 'atmosfer' selera musik mereka secara keseluruhan.",
  "summary": "Satu atau dua paragraf singkat. JANGAN terlalu panjang biar yang baca nggak bosen. **WAJIB** pertebal (bold) kata-kata kunci penting pakai sintaks markdown (contoh: **kreatif**, **misterius**) supaya gampang di-scan mata.",
  "hexColor": "Kode warna hex 6 karakter (mulai dengan #) yang merepresentasikan mood playlist ini.",
  "metrics": [
    {
      "labelLeft": "Nyantai/Galau",
      "labelRight": "On Fire/Hype",
      "value": 75 
    },
    {
      "labelLeft": "Akustik/Organik",
      "labelRight": "Elektronik/Digital",
      "value": 30
    },
    {
      "labelLeft": "Nostalgia/Retro",
      "labelRight": "Futuristik/Modern",
      "value": 50
    }
  ],
  "missingTrack": {
    "title": "Judul Lagu ke-6",
    "artist": "Nama Artis",
    "reason": "Alasan singkat (1-2 kalimat) kenapa lagu ini cocok banget sama 'Aura' musik mereka (tapi mungkin mereka belum tau)."
  }
}`;

      let response;
      let retries = 3;
      let delay = 1000;
      
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          break;
        } catch (err: any) {
          retries--;
          if (retries === 0) {
            throw err;
          }
          console.warn(`Gemini API error, retrying in ${delay}ms...`, err.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }

      const responseText = response?.text;
      if (!responseText) {
        throw new Error("Ngga ada respon dari Gemini API nih");
      }
      
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error: any) {
      console.error("Error generating personality:", error);
      res.status(500).json({ error: error.message || "Gagal baca aura kamu nih." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Standard static serving for production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
