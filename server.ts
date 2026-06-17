import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Simple localized file database for user data
const DB_FILE = path.join(process.cwd(), "users_db.json");

interface UserData {
  username: string;
  passwordHash: string;
  progress?: any;
  updatedAt?: string;
}

let usersDatabase: Record<string, UserData> = {};

// Load existing database
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    usersDatabase = JSON.parse(raw);
    console.log(`[Database] Loaded ${Object.keys(usersDatabase).length} users successfully.`);
  } else {
    console.log("[Database] No database file found, initializing empty DB.");
  }
} catch (err) {
  console.error("[Database] Error loading database, using memory fallback.", err);
}

// Helper to save database safely
function saveDB() {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(usersDatabase, null, 2), "utf-8");
  } catch (err) {
    console.error("[Database] Error saving database file:", err);
  }
}

// Lazy Gemini Initialization
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please add it via Secrets panel.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

// --- AUTH API ---
app.post("/api/auth/register", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (usersDatabase[cleanUsername]) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại trong hệ thống." });
    }

    usersDatabase[cleanUsername] = {
      username: username.trim(),
      passwordHash: password, // Simple password storage for simulation/preview
      progress: {
        completedLessons: [],
        currentLevel: "beginner",
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split("T")[0],
        vocabularyList: [],
        score: 0,
        chatHistory: []
      },
      updatedAt: new Date().toISOString()
    };
    
    saveDB();
    
    res.json({
      success: true,
      message: "Đăng ký thành công!",
      user: {
        username: usersDatabase[cleanUsername].username,
        progress: usersDatabase[cleanUsername].progress
      },
      token: `mock-token-${cleanUsername}-${Date.now()}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi đăng ký tài khoản." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
    }
    const cleanUsername = username.trim().toLowerCase();
    const user = usersDatabase[cleanUsername];

    if (!user || user.passwordHash !== password) {
      return res.status(400).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." });
    }

    res.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        username: user.username,
        progress: user.progress || {}
      },
      token: `mock-token-${cleanUsername}-${Date.now()}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi đăng nhập." });
  }
});

app.post("/api/progress/sync", (req, res) => {
  try {
    const { username, progress } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Yêu cầu đăng nhập để đồng bộ." });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!usersDatabase[cleanUsername]) {
      return res.status(404).json({ error: "Tài khoản không tồn tại." });
    }

    usersDatabase[cleanUsername].progress = progress;
    usersDatabase[cleanUsername].updatedAt = new Date().toISOString();
    saveDB();

    res.json({
      success: true,
      message: "Đồng bộ dữ liệu thành công!",
      progress: usersDatabase[cleanUsername].progress
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi đồng bộ dữ liệu." });
  }
});

// --- AI GRAMMAR & WRITING CORRECTION ---
app.post("/api/ai/correct-writing", async (req, res) => {
  try {
    const { text, topic } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Vui lòng cung cấp văn bản cần sửa lỗi." });
    }

    const ai = getAI();
    const prompt = `Bạn là một giáo viên chuyên chấm điểm và sửa bài viết tiếng Anh.
Hãy phân tích đoạn văn sau đây của người học (chủ đề: ${topic || "Tự do"}).
Văn bản của người học: "${text}"

Hãy cung cấp kết quả ở định dạng JSON chuẩn với các khóa sau (vui lòng gửi nội dung thô trực tiếp là JSON, không bao gồm khối mã markdown \`\`\`json):
- "correctedText": Đoạn văn đã được sửa lại hoàn chỉnh, tự nhiên và trôi chảy nhất.
- "score": Điểm đánh giá độ trôi chảy ngữ pháp (từ 0 đến 100).
- "explanationVi": Lời khuyên tổng quan bằng tiếng Việt về cách diễn đạt, cải thiện bài viết.
- "grammarErrors": Một mảng danh sách các lỗi ngữ pháp tìm thấy. Mỗi lỗi là một đối tượng có:
    - "original": phần từ/cụm từ bị sai trong bài gốc
    - "corrected": cụm từ đúng thay thế
    - "explanation": giải thích chi tiết lỗi này và cách khắc phục bằng tiếng Việt`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const outputText = response.text || "{}";
    res.json(JSON.parse(outputText));
  } catch (error: any) {
    console.error("[Writing Correction Error]:", error);
    res.status(500).json({ error: error.message || "Không thể phân tích ngữ pháp lúc này." });
  }
});

// --- AI PRONUNCIATION & SPEAKING EVALUATION ---
app.post("/api/ai/evaluate-pronunciation", async (req, res) => {
  try {
    const { text, targetText } = req.body;
    if (!text || !targetText) {
      return res.status(400).json({ error: "Thiếu nội dung thực hành nói." });
    }

    const ai = getAI();
    const prompt = `Yêu cầu đánh giá phát âm tiếng Anh so sánh giữa mẫu chuẩn và từ người dùng phát âm qua bộ nhận dạng giọng nói.
Mẫu chuẩn (Target): "${targetText}"
Người dùng nói (Transcribed): "${text}"

Hãy phân tích thật kỹ và trả về kết cấu JSON chuẩn (không có khối mã markdown):
- "score": Điểm số phát âm (0 đến 100) dựa trên độ chính xác từ vựng và sự tương đồng. Mức độ so khớp từ.
- "feedbackVi": Nhận xét bằng tiếng Việt hướng dẫn cách cải thiện phát âm, các âm gió hoặc nối âm cần lưu ý nếu có.
- "wordsFeedback": Một mảng các từ trong câu chuẩn, mỗi từ là đối tượng:
    - "word": từ tiếng anh chuẩn
    - "status": "correct" (nếu người dùng đọc đúng/khớp), "incorrect" (nếu phát âm sai cụm từ này), hoặc "missing" (nếu bỏ qua không đọc từ này)
    - "advice": hướng dẫn phát âm riêng cho từ/âm đó nếu sai bằng tiếng Việt (nếu đúng thì để trống)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("[Pronunciation Evaluation Error]:", error);
    res.status(500).json({ error: error.message || "Không thể chấm điểm phát âm tại thời điểm này." });
  }
});

// --- AI REAL-TIME CHARACTER CHAT ---
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, character } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Lịch sử trò chuyện không hợp lệ." });
    }

    const ai = getAI();

    // Prompts for different AI personas
    let systemInstruction = "";
    if (character === "Sophia") {
      systemInstruction = "You are Sophia, an incredibly patient, warm, and helpful Native English Teacher. Your goal is to run a natural, friendly conversation with an English learner. Keep your sentences relatively brief, simple, clear, and easy to follow. If they make a major English error, gently point it out at the end of your response, but keep the conversation flow focus. Always ask an engaging, simple English question at the end to keep them speaking.";
    } else if (character === "John") {
      systemInstruction = "You are John, a trendy, practical, and highly energetic barista from a bustling New York cafe. You talk in a casual, upbeat American slang, but still friendly for English learners. Keep responses short and snappy, talking about coffee, work, life in NY, or what they'd like to order. Always keep them engaged and encourage daily speaking!";
    } else if (character === "Dr. James") {
      systemInstruction = "You are Dr. James, a professional, polite, and formal human resource manager conducting a simulation job interview. Talk with formal business English, ask deep but clear career and behavioral questions (one at a time), and give formal but encouraging responses. Perfect for intermediate and advanced learners trying to practice for professional interviews.";
    } else if (character === "Emma") {
      systemInstruction = "You are Emma, a warm, lively London tour guide. You speak in standard elegant British English. You speak with high enthusiasm about British history, landmarks like the Big Ben, London Eye, local pubs, and travel adventures. Inspire them to learn travel vocabulary and ask simple travel-related questions.";
    } else {
      systemInstruction = "You are a friendly and encouraging native English helper. Chat naturally, keep sentences polite, clear, and helpful for language practice.";
    }

    // Convert messages format to match Gemini format.
    // The history consists of user and model turns.
    const chatHistory = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.text }]
    }));

    // Perform generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: chatHistory[chatHistory.length - 1]?.parts[0]?.text || "Hello", // latest message context
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const reply = response.text || "I am here to practice English with you!";
    res.json({ reply });
  } catch (error: any) {
    console.error("[AI Chat Error]:", error);
    res.status(500).json({ error: error.message || "Không thể kết nối trò chuyện với nhân vật AI." });
  }
});

// --- SMART VOCABULARY LIST PARSER FOR WORD/EXCEL/TEXT ---
app.post("/api/ai/parse-vocabulary", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || rawText.trim() === "") {
      return res.status(400).json({ error: "Vui lòng nhập danh sách từ vựng cần phân tích." });
    }

    const ai = getAI();
    const prompt = `Bạn là một trợ lý thông thái giúp trích xuất và định dạng danh sách học từ vựng.
Hãy phân tích nội dung sau đây (được sao chép từ tệp Excel, Word, ghi chú hoăc danh sách tự do):
"${rawText}"

Hãy phân tích và tự động điền các trường còn thiếu (vải như phiên âm IPA, nghĩa tiếng Việt chuẩn, ví dụ minh họa tiếng Anh, nghĩa tiếng Việt ví dụ) để tạo ra danh mục từ vựng học tập chất lượng cao.
Kết quả trả về phải là một mảng JSON trực tiếp (không bao gồm khối mã markdown \`\`\`json):
Mỗi đối tượng từ vựng cần có cấu trúc:
- "word": từ tiếng Anh chuẩn (Ví dụ: "Accomplish")
- "pronunciation": Phiên âm quốc tế IPA (Ví dụ: "/əˈkʌm.plɪʃ/")
- "meaningVi": Nghĩa tiếng Việt chuẩn, súc tích (Ví dụ: "Hoàn thành, đạt được")
- "exampleEn": Một ví dụ minh họa hay bằng tiếng Anh (Ví dụ: "She managed to accomplish the task on time.")
- "exampleVi": Nghĩa tiếng Việt của ví dụ đó (Ví dụ: "Cô ấy đã xoay xở để hoàn thành công việc đúng hạn.")
- "level": cấp độ tương ứng ("beginner" hoặc "intermediate" hoặc "advanced") dựa trên mức độ khó của từ.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const outputText = response.text || "[]";
    res.json(JSON.parse(outputText));
  } catch (error: any) {
    console.error("[Parse Vocabulary Error]:", error);
    res.status(500).json({ error: error.message || "Không thể phân tích danh sách từ vựng này." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
