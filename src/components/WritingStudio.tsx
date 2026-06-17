import React, { useState } from "react";
import { BookOpen, CheckCircle, HelpCircle, FileText, Send, Sparkles, RefreshCw, Award } from "lucide-react";

interface WritingStudioProps {
  points: number;
  onGrantPoints: (xp: number) => void;
}

export default function WritingStudio({ points, onGrantPoints }: WritingStudioProps) {
  const writingPrompts = [
    {
      id: "p1",
      topic: "Introduce Yourself (Giới thiệu bản thân)",
      level: "beginner",
      prompt: "Hãy viết 3-4 câu tiếng Anh đơn giản để giới thiệu về tên, tuổi, nơi bạn sống và sở thích của bạn."
    },
    {
      id: "p2",
      topic: "My Favorite Food (Món ăn yêu thích)",
      level: "beginner",
      prompt: "Hãy viết 1 đoạn văn ngắn miêu tả món ăn mà bạn thích nhất bằng tiếng Anh (ví dụ: Phở, Bánh mì, Pizza...) và vì sao bạn thích món ăn đó."
    },
    {
      id: "p3",
      topic: "A Memorable Vacation (Kỳ nghỉ đáng nhớ)",
      level: "intermediate",
      prompt: "Viết khoảng 5-8 câu kể về một chuyến du lịch gần đây của bạn. Bạn đã đi đâu, đi với ai, và có hoạt động thú vị nào diễn ra?"
    },
    {
      id: "p4",
      topic: "How Technology Changes Our Lives (Công nghệ tác động cuộc sống)",
      level: "intermediate",
      prompt: "Trình bày suy nghĩ bằng tiếng Anh về một thiết bị công nghệ hữu ích hằng ngày (như điện thoại thông minh). Nó giúp cuộc sống của bạn tiện lợi hơn như thế nào?"
    },
    {
      id: "p5",
      topic: "Climate Change Solutions (Giải pháp biến đổi khí hậu)",
      level: "advanced",
      prompt: "Write a short argumentative paragraph (100-150 words) proposing effective solutions that individual citizens can implement to reduce their environmental footprint."
    }
  ];

  const [selectedPrompt, setSelectedPrompt] = useState(writingPrompts[0]);
  const [writtenText, setWrittenText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<{
    correctedText: string;
    score: number;
    explanationVi: string;
    grammarErrors: { original: string; corrected: string; explanation: string }[];
  } | null>(null);

  // Character limit tracking
  const wordCount = writtenText.trim() === "" ? 0 : writtenText.trim().split(/\s+/).length;

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount < 3) {
      alert("Vui lòng viết tối thiểu một vài từ tiếng Anh để hệ thống phân tích.");
      return;
    }

    setIsEvaluating(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/correct-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: writtenText,
          topic: selectedPrompt.topic
        })
      });

      if (!response.ok) {
        throw new Error("Không thể liên kết đến máy chủ giáo viên sửa bài.");
      }

      const report = await response.json();
      setResult(report);

      // Reward points upon successful writing turn!
      onGrantPoints(30);
    } catch (err: any) {
      console.error(err);
      simulateOfflineEvaluation();
    } finally {
      setIsEvaluating(false);
    }
  };

  const simulateOfflineEvaluation = () => {
    // Offline simulation backup
    setResult({
      correctedText: writtenText + " (Grammar look good!)",
      score: 85,
      explanationVi: "Để làm việc ngoại tuyến, AI gợi ý bài viết của bạn có liên kết từ tốt. Nhấn Kết nối Internet để nhận đầy đủ chi tiết chỉ mục sửa lỗi.",
      grammarErrors: [
        {
          original: "simulation text",
          corrected: "perfect text",
          explanation: "Đây là tệp chỉnh sửa giả lập offline của hệ thống bọc."
        }
      ]
    });
  };

  return (
    <div id="writing-studio-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Choice Panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-1.5 text-emerald-600">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-extrabold text-xs tracking-wider uppercase"> CHỦ ĐỀ LUYỆN VIẾT</h3>
          </div>

          <div className="space-y-2">
            {writingPrompts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPrompt(p);
                  setResult(null);
                  setWrittenText("");
                }}
                className={`w-full text-left p-3.5 rounded-xl transition border text-xs ${
                  selectedPrompt.id === p.id
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                    : "bg-white border-gray-100 hover:bg-gray-50 text-gray-510"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-mono ${
                    p.level === "beginner" ? "bg-emerald-100 text-emerald-800" : p.level === "intermediate" ? "bg-cyan-100 text-cyan-800" : "bg-indigo-100 text-indigo-800"
                  }`}>
                    {p.level === "beginner" ? "Cơ bản" : p.level === "intermediate" ? "Trung cấp" : "Nâng cao"}
                  </span>
                </div>
                <h4 className="font-bold text-gray-800">{p.topic}</h4>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Prompt Instruction */}
        <div className="bg-emerald-500 text-white rounded-2xl p-5 shadow-sm space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-200">ĐỀ BÀI CHI TIẾT</h4>
          <p className="text-xs font-semibold leading-relaxed">
            {selectedPrompt.prompt}
          </p>
        </div>
      </div>

      {/* Editor & AI feedback */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleEvaluate} className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-gray-800 text-sm">Giao Diện Không Gian Viết</h3>
            </div>
            <span className="font-mono text-xs text-gray-400">
              Số từ: {wordCount} words
            </span>
          </div>

          <textarea
            required
            id="writing-input-textarea"
            placeholder="Bắt đầu viết đoạn văn tiếng Anh của bạn tại đây..."
            value={writtenText}
            onChange={(e) => setWrittenText(e.target.value)}
            className="w-full h-44 p-4 border border-gray-250 rounded-2xl text-xs text-gray-700 bg-gray-50/30 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:border-emerald-500 font-serif leading-relaxed"
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              id="btn-writing-evaluate"
              disabled={isEvaluating}
              className={`inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow-sm ${
                isEvaluating ? "opacity-60 cursor-not-allowed animate-pulse" : ""
              }`}
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Giáo viên đang chấm bài...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Sửa lỗi & Chấm bài bằng AI (+30 XP)</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI Grammatical Report */}
        {result && (
          <div id="writing-evaluation-report" className="bg-white rounded-3xl p-6 border border-gray-150 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-100 pb-4 gap-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-800 text-base">PHIẾU CHẤM ĐOẠN VĂN</h3>
                  <p className="text-[11px] text-gray-400 font-mono">POWERED BY GEMINI WRITING INSTANCE</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 text-xs font-bold rounded-2xl border border-gray-100">
                <span className="text-gray-500 font-mono">ĐIỂM TRÔI CHẢY:</span>
                <span className={`text-xl font-black font-mono ${
                  result.score >= 85 ? "text-emerald-500" : result.score >= 60 ? "text-amber-500" : "text-rose-500"
                }`}>
                  {result.score} / 100
                </span>
              </div>
            </div>

            {/* Comparative View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50/30 border border-amber-100 p-4 rounded-2xl">
                <span className="text-[9px] text-amber-800 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full">BÀI CỦA BẠN</span>
                <p className="text-xs text-gray-700 leading-relaxed font-serif mt-2">{writtenText}</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                <span className="text-[9px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">BÀI AI ĐÃ SỬA</span>
                <p className="text-xs text-emerald-950 leading-relaxed font-serif font-semibold mt-2">{result.correctedText}</p>
              </div>
            </div>

            {/* Teacher Feedback comments */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
              <h5 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">NHẬN XÉT CỦA GIÁO VIÊN</h5>
              <p className="text-xs text-gray-700 leading-relaxed mt-2">
                {result.explanationVi}
              </p>
            </div>

            {/* Structured grammar corrections lists */}
            <div className="space-y-3">
              <h5 className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">CÁC LỖI CẦN LƯU Ý</h5>
              
              {result.grammarErrors && result.grammarErrors.length > 0 ? (
                <div className="space-y-2">
                  {result.grammarErrors.map((err, idx) => (
                    <div key={idx} className="bg-white border hover:border-gray-350 p-4 rounded-xl shadow-sm text-left flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold line-through text-rose-500">{err.original}</span>
                          <span className="text-xs text-gray-400">➔</span>
                          <span className="text-xs font-bold text-emerald-600">{err.corrected}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed pt-1">
                          {err.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/20 text-emerald-700 text-xs text-center font-bold">
                  Perfect! Bài viết của bạn hoàn hảo không phát hiện lỗi sai cần sửa.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
