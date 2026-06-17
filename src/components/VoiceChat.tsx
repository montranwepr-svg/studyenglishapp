import React, { useState, useEffect, useRef } from "react";
import { AICharacter, ChatMessage } from "../types";
import { AI_CHARACTERS } from "../data";
import { Mic, MicOff, Send, Volume2, Globe, AlertCircle, RefreshCw, Star, Trash2 } from "lucide-react";

interface VoiceChatProps {
  onGrantPoints: (xp: number) => void;
}

export default function VoiceChat({ onGrantPoints }: VoiceChatProps) {
  const [selectedChar, setSelectedChar] = useState<AICharacter>(AI_CHARACTERS[0]);
  
  // Chat historical threads keyed by character ID
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({
    sophia: [
      { id: "intro", sender: "ai", text: AI_CHARACTERS[0].greeting, timestamp: new Date().toLocaleTimeString() }
    ],
    john: [
      { id: "intro", sender: "ai", text: AI_CHARACTERS[1].greeting, timestamp: new Date().toLocaleTimeString() }
    ],
    emma: [
      { id: "intro", sender: "ai", text: AI_CHARACTERS[2].greeting, timestamp: new Date().toLocaleTimeString() }
    ],
    james: [
      { id: "intro", sender: "ai", text: AI_CHARACTERS[3].greeting, timestamp: new Date().toLocaleTimeString() }
    ]
  });

  const activeMessages = threads[selectedChar.id] || [];

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [grammarCheckResults, setGrammarCheckResults] = useState<Record<string, string>>({}); // stores correction tips per user msg id
  const [translations, setTranslations] = useState<Record<string, string>>({}); // stores Vietnamese translations per msg id

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize Speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onerror = (e: any) => {
        console.error(e);
        setIsRecording(false);
      };
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? " " : "") + transcript);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Sync scroll on chat thread change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isAiLoading]);

  // Voice speaker (English synthesized accent)
  const speakAIResponse = (text: string, accent: "us" | "uk") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Auto assign matched voices if present
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;
      if (accent === "uk") {
        matchedVoice = voices.find(v => v.lang.toLowerCase().includes("en-gb") || v.name.toLowerCase().includes("united kingdom")) || null;
      } else {
        matchedVoice = voices.find(v => v.lang.toLowerCase().includes("en-us") || v.name.toLowerCase().includes("google us")) || null;
      }
      if (matchedVoice) utterance.voice = matchedVoice;
      
      utterance.lang = accent === "uk" ? "en-GB" : "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle voice recognition
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Mic không hỗ trợ trong môi trường này hoặc iFrame chặn quyền truy cập. Bạn hãy click 'Mở ra tab mới' ở trên để cấp quyền đầy đủ, hoặc gõ bàn phím trực tiếp!");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsgId = `usr_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedThread = [...activeMessages, userMessage];
    setThreads(prev => ({
      ...prev,
      [selectedChar.id]: updatedThread
    }));
    setInputText("");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedThread,
          character: selectedChar.name
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi máy chủ AI.");
      }

      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString()
      };

      setThreads(prev => ({
        ...prev,
        [selectedChar.id]: [...updatedThread, aiMessage]
      }));

      // Speak automatically!
      speakAIResponse(data.reply, selectedChar.accent);

      onGrantPoints(15);
    } catch (err) {
      // Offline mock response safely
      console.error(err);
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: `Offline Mode: I received your message. You are doing fantastic! Please check your internet connection to access live Gemini dynamic conversations.`,
          timestamp: new Date().toLocaleTimeString()
        };
        setThreads(prev => ({
          ...prev,
          [selectedChar.id]: [...updatedThread, aiMessage]
        }));
      }, 1000);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Translate service for text
  const handleTranslate = async (message: ChatMessage) => {
    if (translations[message.id]) return; // already translated

    try {
      const response = await fetch("/api/ai/correct-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Translate this strictly into beautiful Vietnamese: "${message.text}"`,
          topic: "Translation"
        })
      });
      const data = await response.json();
      setTranslations(prev => ({
        ...prev,
        [message.id]: data.correctedText || "Bản dịch lỗi."
      }));
    } catch (err) {
      // Simple offline translations
      setTranslations(prev => ({
        ...prev,
        [message.id]: "(Ngoại tuyến) Hãy kết nối mạng để dịch tự động bằng AI."
      }));
    }
  };

  // AI grammar evaluation for a specific user chat bubble (Sửa lỗi cho tôi)
  const handleVerifyGrammar = async (message: ChatMessage) => {
    if (grammarCheckResults[message.id]) return;

    try {
      const response = await fetch("/api/ai/correct-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.text,
          topic: "Speaking Practice Dialogue"
        })
      });
      const rawReport = await response.json();

      let grammarAdvice = "";
      if (rawReport.score >= 90) {
        grammarAdvice = `✔ Tuyệt vời! Câu của bạn hoàn toàn chính xác về ngữ pháp (Điểm: ${rawReport.score}/100)`;
      } else {
        grammarAdvice = `✍ Gợi ý sửa lỗi: "${rawReport.correctedText}" (Điểm cấu trúc: ${rawReport.score}/100). Lời khuyên: ${rawReport.explanationVi}`;
      }

      setGrammarCheckResults(prev => ({
        ...prev,
        [message.id]: grammarAdvice
      }));
    } catch (err) {
      setGrammarCheckResults(prev => ({
        ...prev,
        [message.id]: "Lỗi phân tích cú pháp (Hãy chắc chắn bạn có mạng Internet)."
      }));
    }
  };

  const handleClearHistory = () => {
    setThreads(prev => ({
      ...prev,
      [selectedChar.id]: [
        { id: "intro", sender: "ai", text: selectedChar.greeting, timestamp: new Date().toLocaleTimeString() }
      ]
    }));
  };

  return (
    <div id="voice-chat-page" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Active character sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs tracking-wider uppercase">Chọn Bạn Đồng Hành AI</h3>
          
          <div className="space-y-2">
            {AI_CHARACTERS.map((char) => {
              const active = char.id === selectedChar.id;
              return (
                <button
                  key={char.id}
                  id={`char-btn-${char.id}`}
                  onClick={() => {
                    setSelectedChar(char);
                    setGrammarCheckResults({});
                    setTranslations({});
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition border flex items-center space-x-3 ${
                    active ? "bg-emerald-50 text-emerald-800 border-emerald-250 font-bold" : "bg-white border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${char.avatar} text-white flex items-center justify-center font-bold text-sm shadow`}>
                    {char.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-gray-800 truncate">{char.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5">{char.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Character detail explanation card */}
        <div className={`rounded-2xl p-5 text-white shadow shadow-md space-y-3 bg-gradient-to-tr from-emerald-600 to-cyan-600`}>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            <h4 className="text-[10px] font-bold tracking-wider font-mono uppercase text-emerald-200">ĐẶC ĐIỂM NHÂN VẬT</h4>
          </div>
          <p className="text-xs font-semibold leading-relaxed">
            {selectedChar.description}
          </p>
          <div className="text-[10px] font-mono opacity-80 border-t border-white/20 pt-2 uppercase flex justify-between">
            <span>Accent: {selectedChar.accent === "uk" ? "British (UK)" : "American (US)"}</span>
            <span>Speed: 0.9x Auto</span>
          </div>
        </div>
      </div>

      {/* Main Dialog Panel */}
      <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-150 flex flex-col h-[520px] shadow-sm relative overflow-hidden">
        {/* Thread Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full ${selectedChar.avatar} text-white flex items-center justify-center font-bold text-sm`}>
              {selectedChar.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-800">{selectedChar.name}</h3>
              <p className="text-[10px] text-emerald-500 font-mono">● Đang tương tác bằng giọng nói</p>
            </div>
          </div>
          <button
            id="clear-chat-history"
            onClick={handleClearHistory}
            className="text-gray-400 hover:text-rose-500 p-2 rounded-lg transition"
            title="Xóa cuộc trò chuyện"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeMessages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] space-y-1.5 ${isUser ? "text-right" : "text-left"}`}>
                  <div
                    className={`p-3.5 rounded-2.5xl text-xs leading-relaxed inline-block text-left shadow-sm border ${
                      isUser
                        ? "bg-emerald-500 text-white border-emerald-400 rounded-br-none"
                        : "bg-gray-100/80 text-gray-800 border-gray-100 rounded-bl-none"
                    }`}
                  >
                    <p className="font-serif text-[12.5px] leading-relaxed font-semibold">{msg.text}</p>
                    
                    {/* Translated auxiliary text display inside card */}
                    {translations[msg.id] && (
                      <p className={`text-[10.5px] pt-1.5 border-t mt-1.5 leading-relaxed font-medium ${isUser ? "border-emerald-400 text-emerald-100" : "border-gray-250 text-gray-500"}`}>
                        🇻🇳 {translations[msg.id]}
                      </p>
                    )}
                  </div>

                  {/* Bubble tool shortcuts */}
                  <div className={`flex items-center gap-2 text-[10px] ${isUser ? "justify-end" : "justify-start"}`}>
                    <span className="text-[9px] text-gray-400">{msg.timestamp}</span>

                    <button
                      id={`translate-bubble-${msg.id}`}
                      onClick={() => handleTranslate(msg)}
                      className="text-gray-400 hover:text-emerald-600 transition flex items-center"
                      title="Dịch nghĩa bằng AI"
                    >
                      <Globe className="w-3 h-3 mr-0.5" /> Dịch
                    </button>

                    {!isUser && (
                      <button
                        onClick={() => speakAIResponse(msg.text, selectedChar.accent)}
                        className="text-gray-400 hover:text-emerald-600 transition flex items-center"
                        title="Đọc lại giọng chuẩn"
                      >
                        <Volume2 className="w-3 h-3 mr-0.5" /> Đọc
                      </button>
                    )}

                    {isUser && (
                      <button
                        id={`check-grammar-${msg.id}`}
                        onClick={() => handleVerifyGrammar(msg)}
                        className="text-gray-400 hover:text-cyan-600 transition flex items-center font-bold"
                        title="AI Sửa lỗi ngữ pháp"
                      >
                        Sửa lỗi
                      </button>
                    )}
                  </div>

                  {/* Grammar Analysis results underneath balloon bubble */}
                  {grammarCheckResults[msg.id] && (
                    <div className="bg-cyan-50/50 p-2.5 rounded-xl text-[10px] border border-cyan-100 text-cyan-800 font-medium text-left">
                      {grammarCheckResults[msg.id]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isAiLoading && (
            <div className="flex justify-start">
              <div className="space-y-1">
                <div id="ai-loading-bubble" className="bg-gray-100/80 p-3.5 rounded-2.5xl rounded-bl-none border border-gray-100 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input box workspace panel */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex items-center gap-3">
          {/* Micro Recording activator button with pulsating animation */}
          <button
            type="button"
            id="voice-chat-mic"
            onClick={toggleRecording}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition flex-shrink-0 ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-emerald-500 hover:text-white"
            }`}
            title="Nói giọng trực tiếp (Bật micro)"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            id="voice-chat-text-input"
            required
            placeholder={isRecording ? "Đang lắng nghe qua mic... hãy nói tiếng Anh..." : "Nhập tin nhắn tiếng Anh của bạn..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full text-xs px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />

          <button
            type="submit"
            id="voice-chat-send"
            className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition shadow flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
