import React, { useState } from "react";
import { LearnerLevel, VocabularyItem } from "../types";
import { PlusCircle, Search, Volume2, FileSpreadsheet, Import, Check, AlertCircle, FileText, Image, Trash2 } from "lucide-react";

interface VocabularyPanelProps {
  currentLevel: LearnerLevel;
  coreVocabulary: VocabularyItem[];
  customVocabulary: VocabularyItem[];
  onAddWord: (word: VocabularyItem) => void;
  onDeleteCustomWord: (id: string) => void;
}

export default function VocabularyPanel({
  currentLevel,
  coreVocabulary,
  customVocabulary,
  onAddWord,
  onDeleteCustomWord
}: VocabularyPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "core" | "custom">("all");

  // Manual word entry state
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualWord, setManualWord] = useState({
    word: "",
    pronunciation: "",
    meaningVi: "",
    exampleEn: "",
    exampleVi: ""
  });

  // Bulk raw paste state
  const [isImportingRaw, setIsImportingRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Combine lists
  const filteredCore = coreVocabulary.filter((w) => w.level === currentLevel);
  const filteredCustom = customVocabulary.filter((w) => w.level === currentLevel);

  let combinedList: VocabularyItem[] = [];
  if (activeTab === "all") {
    combinedList = [...filteredCore, ...filteredCustom];
  } else if (activeTab === "core") {
    combinedList = filteredCore;
  } else {
    combinedList = filteredCustom;
  }

  // Search filter
  const displayedVocabulary = combinedList.filter(
    (w) =>
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.meaningVi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Standard voice synthesis speaker
  const speakWord = (wordText: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Manual word submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWord.word || !manualWord.meaningVi) {
      alert("Vui lòng nhập tối thiểu từ tiếng Anh và Nghĩa tiếng Việt.");
      return;
    }

    const newVocab: VocabularyItem = {
      id: `custom_${Date.now()}`,
      word: manualWord.word.trim(),
      pronunciation: manualWord.pronunciation.trim() || "/.../",
      meaningVi: manualWord.meaningVi.trim(),
      exampleEn: manualWord.exampleEn.trim() || "Example sentence will be added.",
      exampleVi: manualWord.exampleVi.trim() || "Nghĩa tiếng Việt của ví dụ.",
      level: currentLevel,
      isCustom: true
    };

    onAddWord(newVocab);
    setManualWord({ word: "", pronunciation: "", meaningVi: "", exampleEn: "", exampleVi: "" });
    setIsAddingManual(false);
  };

  // Smart AI raw importer parser (Copied from Word/Excel logs)
  const handleParseImporter = async () => {
    if (!rawText.trim()) {
      alert("Hãy dán danh sách từ vựng từ tệp Word hoặc Excel của bạn.");
      return;
    }

    setIsParsing(true);
    setImportFeedback("Đang kết nối gửi yêu cầu AI phân tích dữ liệu bảng...");

    try {
      const response = await fetch("/api/ai/parse-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText })
      });

      if (!response.ok) {
        throw new Error("Không thể kết nối đến máy chủ parser.");
      }

      const wordsList = await response.json();

      if (Array.isArray(wordsList) && wordsList.length > 0) {
        wordsList.forEach((parsedWord: any, idx: number) => {
          onAddWord({
            id: `custom_parsed_${Date.now()}_${idx}`,
            word: parsedWord.word,
            pronunciation: parsedWord.pronunciation || "/.../",
            meaningVi: parsedWord.meaningVi,
            exampleEn: parsedWord.exampleEn || "No example provided.",
            exampleVi: parsedWord.exampleVi || "",
            level: parsedWord.level || currentLevel,
            isCustom: true
          });
        });

        setImportFeedback(`Đồng bộ thành công ${wordsList.length} từ vựng từ danh sách của bạn vào vở từ vựng!`);
        setRawText("");
        setTimeout(() => {
          setIsImportingRaw(false);
          setImportFeedback(null);
        }, 3000);
      } else {
        setImportFeedback("Không thể trích xuất định dạng phù hợp. Vui lòng kiểm tra lại văn bản.");
      }
    } catch (err: any) {
      setImportFeedback(`Lỗi phân tích: ${err.message || err}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Get dynamic image illustration placeholder styled beautifully
  const getGradientForCategory = (word: string) => {
    // Generate simple deterministic gradient using string length
    const idx = word.length % 5;
    const gradients = [
      "from-teal-50 to-emerald-100 border-teal-200 text-teal-700",
      "from-rose-50 to-pink-100 border-rose-200 text-rose-700",
      "from-cyan-50 to-blue-100 border-cyan-200 text-cyan-700",
      "from-amber-50 to-yellow-105 border-amber-200 text-amber-700",
      "from-indigo-50 to-purple-100 border-indigo-200 text-indigo-700"
    ];
    return gradients[idx];
  };

  return (
    <div id="vocab-panel-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Control Panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Statistics and tab selection */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-sm">Bộ Lọc Từ Vựng</h3>
          
          <div className="space-y-2">
            {[
              { id: "all", label: "Tất cả từ vựng" },
              { id: "core", label: "Từ vựng hệ thống" },
              { id: "custom", label: "Từ vựng của tôi" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex justify-between items-center transition ${
                  activeTab === tab.id
                    ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 font-bold"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-gray-100 font-mono text-gray-600 px-2 py-0.5 rounded-md text-[10px]">
                  {tab.id === "all"
                    ? filteredCore.length + filteredCustom.length
                    : tab.id === "core"
                    ? filteredCore.length
                    : filteredCustom.length}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              * Thay đổi cấp độ (Cơ bản, Trung cấp, Nâng cao) tại đầu thanh thực dụng để lọc danh sách từ vựng phù hợp.
            </p>
          </div>
        </div>

        {/* Action button panel */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-800 text-sm">Xây Dựng Học Liệu</h3>

          <div className="grid grid-cols-1 gap-2">
            <button
              id="btn-add-word-manual"
              onClick={() => {
                setIsAddingManual(true);
                setIsImportingRaw(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm từ vựng đơn lẻ</span>
            </button>

            <button
              id="btn-import-vocab-raw"
              onClick={() => {
                setIsImportingRaw(true);
                setIsAddingManual(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-cyan-50 text-cyan-800 rounded-xl text-xs font-bold hover:bg-cyan-100 transition border border-cyan-200"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Nhập từ Word / Excel / Copy-paste</span>
            </button>
          </div>
        </div>

        {/* Dynamic Entry Forms */}
        {isAddingManual && (
          <form onSubmit={handleManualSubmit} className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-800 text-xs">THÊM TỪ MỚI THỦ CÔNG</h3>
              <button
                type="button"
                onClick={() => setIsAddingManual(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Hủy
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Từ Tiếng Anh *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accomplish"
                  value={manualWord.word}
                  onChange={(e) => setManualWord({ ...manualWord, word: e.target.value })}
                  className="w-full px-3 py-1.5 mt-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Phiên âm IPA</label>
                <input
                  type="text"
                  placeholder="e.g. /əˈkʌm.plɪʃ/"
                  value={manualWord.pronunciation}
                  onChange={(e) => setManualWord({ ...manualWord, pronunciation: e.target.value })}
                  className="w-full px-3 py-1.5 mt-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hoàn thành, đạt được"
                  value={manualWord.meaningVi}
                  onChange={(e) => setManualWord({ ...manualWord, meaningVi: e.target.value })}
                  className="w-full px-3 py-1.5 mt-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Ví dụ Tiếng Anh</label>
                <textarea
                  placeholder="e.g. She managed to accomplish the task on time."
                  value={manualWord.exampleEn}
                  onChange={(e) => setManualWord({ ...manualWord, exampleEn: e.target.value })}
                  className="w-full px-3 py-1.5 mt-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Nghĩa tiếng Việt ví dụ</label>
                <input
                  type="text"
                  placeholder="e.g. Cô ấy vẫn hoàn thành nhiệm vụ đúng hạn."
                  value={manualWord.exampleVi}
                  onChange={(e) => setManualWord({ ...manualWord, exampleVi: e.target.value })}
                  className="w-full px-3 py-1.5 mt-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                id="btn-manual-vocab-save"
                className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition"
              >
                Lưu vào bộ từ
              </button>
            </div>
          </form>
        )}

        {isImportingRaw && (
          <div className="bg-white border-2 border-cyan-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-800 text-xs">NHẬP BẰNG TRÍ TUỆ NHÂN TẠO</h3>
              <button
                type="button"
                onClick={() => setIsImportingRaw(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Hủy
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Sao chép và dán nguyên văn hàng/cột từ tệp <strong>Word</strong> hoặc <strong>Excel</strong> của bạn vào đây. AI của chúng tôi sẽ tự động phân tích và tạo đầy đủ các thẻ từ vựng chỉnh sửa.
              </p>

              <textarea
                placeholder="Ví dụ:&#10;Accomplish - đạt được&#10;Destination  /ˌdes.təˈneɪ.ʃən/  điểm đến&#10;Hoặc dán trực tiếp bảng từ Excel..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-250 rounded-xl text-xs focus:ring-1 focus:ring-cyan-500 font-mono h-32 resize-none"
              />

              {importFeedback && (
                <div className={`p-2 rounded text-[10px] ${isParsing ? "bg-amber-50 text-amber-800 border border-amber-100" : "bg-teal-50 text-teal-800 border border-teal-100"}`}>
                  <p>{importFeedback}</p>
                </div>
              )}

              <button
                type="button"
                id="btn-parse-and-save"
                onClick={handleParseImporter}
                disabled={isParsing}
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-2 ${
                  isParsing ? "bg-gray-400 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-700"
                }`}
              >
                <Import className="w-3.5 h-3.5" />
                <span>{isParsing ? "Đang xử lý bằng AI..." : "Phân tích & Thêm vào bộ từ"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Display List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search tool */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center px-4 space-x-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            id="vocab-search"
            placeholder="Tìm kiếm từ vựng hoặc dịch nghĩa tiếng Việt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
          />
        </div>

        {/* Word card grid */}
        {displayedVocabulary.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 shadow-sm">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-200 mb-2" />
            <p className="text-sm">Không tìm thấy từ vựng học tập nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedVocabulary.map((vocab) => {
              const bgClass = getGradientForCategory(vocab.word);
              return (
                <div
                  key={vocab.id}
                  id={`vocab-card-${vocab.id}`}
                  className="bg-white border border-gray-100 hover:border-emerald-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-300 relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Badge and illustration block */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full uppercase">
                          {vocab.category || "Học tập"}
                        </span>
                        {vocab.isCustom && (
                          <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full uppercase">
                            Của tôi
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          id={`speak-btn-${vocab.id}`}
                          onClick={() => speakWord(vocab.word)}
                          className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        {vocab.isCustom && (
                          <button
                            id={`delete-vocab-${vocab.id}`}
                            onClick={() => onDeleteCustomWord(vocab.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition"
                            title="Xóa từ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Word illustration */}
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 border ${bgClass}`}>
                      <div className="p-2 bg-white/60 rounded-xl">
                        <Image className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold tracking-tight font-serif uppercase">{vocab.word}</h4>
                        <p className="text-[11px] font-mono opacity-80">{vocab.pronunciation}</p>
                      </div>
                    </div>

                    {/* Translations and example */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-800">
                        <span className="text-emerald-600 mr-1">■</span> {vocab.meaningVi}
                      </p>
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/40 text-[11px] space-y-1">
                        <p className="text-gray-600 italic font-serif">"{vocab.exampleEn}"</p>
                        <p className="text-gray-400">{vocab.exampleVi}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
