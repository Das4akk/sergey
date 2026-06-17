import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/void-thought", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "Ключ Gemini API отсутствует. Пустота хранит молчание." });
      }

      const { level, mass } = req.body;
      const prompt = `Ты — воплощение минималистичной, бесконечной пустоты в медитативной инкрементальной игре. 
Игрок достиг Уровня ${level} с массой ${mass}.
Дай ему очень короткую (не более 1-2 предложений), поэтичную и глубоко атмосферную мысль или наблюдение о росте, бесконечности, гравитации или пустоте. 
Это должно быть загадочно, но очень поэтично. 
Отвечай исключительно на русском языке.
Никаких приветствий, никаких кавычек вокруг текста. Только чистый текст.
Используй метафоры из физики света и тьмы (градиенты, сумерки, орбиты, резонанс, кванты).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
            systemInstruction: "Ты безмолвный голос математической пустоты. Твои ответы загадочны, прекрасны, меланхоличны и предельно лаконичны. Отвечай на русском языке."
        }
      });
      
      res.json({ thought: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Не удалось услышать пустоту." });
    }
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
