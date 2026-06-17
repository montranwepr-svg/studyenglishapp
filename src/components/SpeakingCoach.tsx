import React, { useState, useEffect, useRef } from "react";
import { VocabularyItem } from "../types";
import { Mic, MicOff, Play, Volume2, Search, RotateCcw, HelpCircle, CheckCircle, Award } from "lucide-react";

interface SpeakingCoachProps {
  vocabularyList: VocabularyItem[];
}

export default function SpeakingCoach({ vocabularyList }: SpeakingCoachProps) {
  // Practice sentence choices (from core vocabulary examples)
  const defaultPracticeSentences = [
    "Hello! Nice to meet you today.",
    "I love spending my weekends with my family.",
    "This bowl of Pho is absolutely delicious!",
    "It is a beautiful sunny Sunday in London.",
    "Da Nang is a very popular tourist destination in Vietnam.",
    "Technology innovation drives fast business growth.",
    "We must act together to protect our environment."
  ];

  // Pick practice items
  const practiceSentences = vocabularyList.length > 0
    ? [...new Set([...vocabularyList.map(v => v.exampleEn), ...defaultPracticeSentences])]
    : defaultPracticeSentences;

  const [selectedTarget, setSelectedTarget] = useState(practiceSentences[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Result state
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    feedbackVi: string;
    wordsFeedback?: { word: string; status: "correct" | "incorrect" | "missing"; advice?: string }[];
  } | null>(null);

  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Web Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US"; // English speak

      rec.onstart = () => {
        setIsRecording(true);
        setTranscribedText("");
        setRecognitionError(null);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        if (event.error === "not-allowed") {
          setRecognitionError("Hãy mở ra tab mới và cấp quyền truy cập Microphone cho trình duyệt.");
        } else {
          setRecognitionError(`Lỗi mic: ${event.error}. Vui lòng thử lại.`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscribedText(resultText);
        // Automatically evaluate on completion
        evaluateSpeechText(resultText);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Trigger speech recording
  const startRecording = () => {
    if (!recognitionRef.current) {
      // Manual text fallback or browser warning
      setRecognitionError("Trình duyệt không hỗ trợ Web Speech API trực tiếp trong khung này. Bạn có thể sử dụng tính năng thử giọng bằng cách NHẬP VĂN BẢN thủ công bên dưới để chạy AI chấm điểm!");
      return;
    }
    try {
      setEvaluationResult(null);
      setTranscribedText("");
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
      recognitionRef.current.stop();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Speaks target sentence out loud
  const playTargetAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(selectedTarget);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Perform AI Pronunciation evaluation calling Express API
  const evaluateSpeechText = async (textToGrade: string) => {
    if (!textToGrade.trim()) return;
    setIsEvaluating(true);

    try {
      const response = await fetch("/api/ai/evaluate-pronunciation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToGrade,
          targetText: selectedTarget
        })
      });

      if (!response.ok) {
        throw new Error("Không thể liên kết máy chủ sửa âm.");
      }

      const report = await response.json();
      setEvaluationResult(report);
    } catch (err: any) {
      // Local fallback scoring algorithm if server encounters API error
      console.error(err);
      simulateLocalEvaluation(textToGrade);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Robust offline simulation backup
  const simulateLocalEvaluation = (text: string) => {
    const cleanTarget = selectedTarget.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const cleanUser = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const targetWords = cleanTarget.split(/\s+/);
    const userWords = cleanUser.split(/\s+/);

    let matchCount = 0;
    const wordsFeedback = targetWords.map(w => {
      const exists = userWords.includes(w);
      if (exists) matchCount++;
      return {
        word: w,
        status: exists ? "correct" as const : "missing" as const,
        advice: exists ? "" : "Hãy cố gắng phát âm rõ chữ này hơn."
      };
    });

    const score = targetWords.length ? Math.round((matchCount / targetWords.length) * 100) : 0;
    setEvaluationResult({
      score,
      feedbackVi: `Phản hồi ngoại tuyến: Đã nhận dạng được từ khóa. Độ so khớp từ phát âm đạt ${score}%. Hãy duy trì luyện tập!`,
      wordsFeedback
    });
  };

  // Manual evaluation trigger (when microphone is missing or unsupported)
  const [manualText, setManualText] = useState("");
  const handleManualEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscribedText(manualText);
    evaluateSpeechText(manualText);
    setManualText("");
  };

  return (
    <div id="speaking-coach-container" className="space-y-6">
      {/* Target Selector */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] bg-cyan-50 text-cyan-700 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
            LUYỆN PHÁT ÂM CÙNG GIÁO VIÊN AI
          </span>
          <h2 className="text-base font-bold text-gray-800 mt-1">Chọn hoặc nhập câu tiếng Anh cần thực hành nói:</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Hãy chọn câu mẫu</label>
            <select
              id="speaking-target-select"
              value={selectedTarget}
              onChange={(e) => {
                setSelectedTarget(e.target.value);
                setEvaluationResult(null);
                setTranscribedText("");
              }}
              className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-gray-700 focus:ring-1 focus:ring-emerald-500 max-h-48"
            >
              {practiceSentences.map((sent, index) => (
                <option key={index} value={sent}>
                  {sent.length > 55 ? sent.substring(0, 52) + "..." : sent}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Tự tạo câu của riêng bạn</label>
            <input
              type="text"
              id="speaking-custom-target"
              placeholder="Nhập bất kỳ câu tiếng Anh nào..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSelectedTarget(e.currentTarget.value);
                  setEvaluationResult(null);
                  setTranscribedText("");
                  e.currentTarget.value = "";
                }
              }}
              className="w-full text-xs bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-gray-700 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Target Display and Micro Actions */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CÂU MẪU CẦN ĐỌC</p>
          <div className="flex justify-center items-center space-x-3">
            <h3 className="text-xl font-bold text-emerald-800 font-serif max-w-2xl">
              {selectedTarget}
            </h3>
            <button
              id="btn-speak-target"
              onClick={playTargetAudio}
              className="p-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-full transition shadow-sm"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Waves Animation & Micro controls */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {isRecording ? (
            <div className="space-y-2 text-center">
              <div className="flex justify-center items-center space-x-1.5 h-8">
                <span className="w-1 bg-rose-505 bg-rose-500 h-6 rounded animate-bounce delay-75" />
                <span className="w-1 bg-rose-500 h-8 rounded animate-bounce" />
                <span className="w-1 bg-rose-500 h-5 rounded animate-bounce delay-150" />
                <span className="w-1 bg-rose-500 h-7 rounded animate-bounce delay-100" />
                <span className="w-1 bg-rose-500 h-4 rounded animate-bounce delay-300" />
              </div>
              <p className="text-xs text-rose-500 font-semibold animate-pulse">Hệ thống đang thu âm giọng nói của bạn... Hãy nói đi!</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Nhấp nút micro để bắt đầu nói</p>
          )}

          <div className="flex items-center space-x-4">
            {isRecording ? (
              <button
                id="btn-speaking-stop"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition duration-300 border-4 border-white ring-4 ring-rose-100"
              >
                <MicOff className="w-7 h-7" />
              </button>
            ) : (
              <button
                id="btn-speaking-start"
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition duration-300 border-4 border-white ring-4 ring-emerald-100"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}
          </div>

          {recognitionError && (
            <div className="max-w-md mx-auto p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 text-left space-y-2">
              <div className="flex items-start space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium leading-relaxed">{recognitionError}</p>
              </div>

              {/* Text Input Fallback */}
              <form onSubmit={handleManualEvaluate} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Dán câu bạn luyện viết hay dán giọng tiếng Anh..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-amber-200 bg-white rounded-lg focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg transition"
                >
                  Gửi AI
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Transcribed Text Result */}
        {transcribedText && (
          <div className="bg-gray-50 rounded-2xl p-4 max-w-xl mx-auto border border-gray-100 text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase">KẾT QUẢ THU ÂM CỦA BẠN</span>
            <p className="text-sm font-semibold text-gray-800 mt-1 font-mono italic">
              "{transcribedText}"
            </p>
          </div>
        )}
      </div>

      {/* AI Performance Evaluation Report Card */}
      {isEvaluating && (
        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Giáo viên AI đang lắng nghe và chấm điểm phát âm từng từ ngữ mẫu phác thảo...</p>
        </div>
      )}

      {evaluationResult && (
        <div id="speaking-evaluation-report" className="bg-white rounded-3xl p-6 border border-gray-150 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-100 pb-4 gap-4">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-800 text-base">PHIẾU CHẤM PHÁT ÂM</h3>
                <p className="text-[11px] text-gray-400 font-mono">POWERED BY GEMINI PRO AI</p>
              </div>
            </div>

            {/* Circular score display */}
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
              <span className="text-xs font-bold text-gray-500 font-mono">ĐIỂM SỐ:</span>
              <span className={`text-2xl font-black font-mono ${
                evaluationResult.score >= 80 ? "text-emerald-500" : evaluationResult.score >= 50 ? "text-amber-500" : "text-rose-500"
              }`}>
                {evaluationResult.score} / 100
              </span>
            </div>
          </div>

          {/* Correct/Incorrect word highlighted visualization */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SO SÁNH CHI TIẾT TỪNG TỪ MẪU</h4>
            
            {evaluationResult.wordsFeedback ? (
              <div className="flex flex-wrap gap-2.5 p-4 bg-gray-50 rounded-2.5xl border border-gray-100 p-4">
                {evaluationResult.wordsFeedback.map((wf, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      wf.status === "correct"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : wf.status === "incorrect"
                        ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                        : "bg-amber-50 text-amber-800 border-amber-200 line-through opacity-60"
                    }`}
                    title={wf.advice || "Phát âm chính xác!"}
                  >
                    <span>{wf.word}</span>
                    {wf.advice && (
                      <span className="block text-[8px] text-rose-600 font-normal mt-0.5">
                        {wf.advice}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-500">
                Ngoại tuyến: Hãy so khớp lại giọng nói trực quan của bạn.
              </div>
            )}
          </div>

          {/* Expert verbal Coaching Feedback */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 text-left">
            <h5 className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">HƯỚNG DẪN TỪ GIÁO VIÊN AI</h5>
            <p className="text-xs text-gray-700 leading-relaxed mt-2.5">
              {evaluationResult.feedbackVi}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
