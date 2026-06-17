import React, { useState, useEffect } from "react";
import { LearnerLevel, LessonNode, VocabularyItem } from "./types";
import { CORE_LESSONS, CORE_VOCABULARY } from "./data";
import Navbar from "./components/Navbar";
import Roadmap from "./components/Roadmap";
import VocabularyPanel from "./components/VocabularyPanel";
import SpeakingCoach from "./components/SpeakingCoach";
import WritingStudio from "./components/WritingStudio";
import VoiceChat from "./components/VoiceChat";
import WordGame from "./components/WordGame";

import {
  Map,
  BookOpen,
  Mic,
  FileText,
  MessageSquare,
  Gamepad2,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  LogOut,
  X,
  AlertTriangle,
  Globe
} from "lucide-react";

export default function App() {
  // --- STATE SYSTEM ---
  const [currentLevel, setLevel] = useState<LearnerLevel>("beginner");
  const [activeTab, setActiveTab] = useState<"roadmap" | "vocab" | "speaking" | "writing" | "chat" | "game">("roadmap");

  // User auth state
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authFields, setAuthFields] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync state management
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "offline">("synced");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Progress states
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [customVocabulary, setCustomVocabulary] = useState<VocabularyItem[]>([]);
  const [points, setPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(1);
  const [lastActiveDate, setLastActiveDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Active Lesson Practice state
  const [selectedLesson, setSelectedLesson] = useState<LessonNode | null>(null);
  const [lessonStep, setLessonStep] = useState<"prep" | "quiz">("prep");
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null);
  const [lessonFeedbackMsg, setLessonFeedbackMsg] = useState("");

  // --- PERSISTENCE FALLBACKS ---
  // Load initially from localstorage
  useEffect(() => {
    try {
      const cacheUser = localStorage.getItem("app_learner_user");
      if (cacheUser) {
        setCurrentUser(cacheUser);
      }

      const cacheLessons = localStorage.getItem("app_completed_lessons");
      if (cacheLessons) {
        setCompletedLessons(JSON.parse(cacheLessons));
      }

      const cacheVocab = localStorage.getItem("app_custom_vocabulary");
      if (cacheVocab) {
        setCustomVocabulary(JSON.parse(cacheVocab));
      }

      const cachePoints = localStorage.getItem("app_user_points");
      if (cachePoints) {
        setPoints(Number(cachePoints));
      }

      const cacheStreak = localStorage.getItem("app_user_streak");
      if (cacheStreak) {
        setStreakDays(Number(cacheStreak));
      }

      const cacheDate = localStorage.getItem("app_user_last_active_date");
      if (cacheDate) {
        setLastActiveDate(cacheDate);
      }
    } catch (err) {
      console.warn("Storage warning:", err);
    }

    // Set online network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update streak status based on activities
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActiveDate === yesterdayStr) {
        setStreakDays((prev) => prev + 1);
      } else {
        setStreakDays(1);
      }
      setLastActiveDate(today);
      localStorage.setItem("app_user_streak", streakDays.toString());
      localStorage.setItem("app_user_last_active_date", today);
    }
  }, [lastActiveDate]);

  // Synchronize local states to LocalStorage
  const persistLocal = (
    lessonsList: string[],
    vocabList: VocabularyItem[],
    pts: number
  ) => {
    try {
      localStorage.setItem("app_completed_lessons", JSON.stringify(lessonsList));
      localStorage.setItem("app_custom_vocabulary", JSON.stringify(vocabList));
      localStorage.setItem("app_user_points", pts.toString());
      setSyncStatus("pending");
    } catch (err) {
      console.error(err);
    }
  };

  // --- AUTOMATED API CLOUD SYNC ---
  const handleCloudSync = async (userToSync = currentUser, forceLessons = completedLessons, forceVocab = customVocabulary, forcePoints = points) => {
    if (!userToSync || !isOnline) {
      setSyncStatus("offline");
      return;
    }

    try {
      const response = await fetch("/api/progress/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userToSync,
          progress: {
            completedLessons: forceLessons,
            customVocabulary: forceVocab,
            points: forcePoints,
            streakDays,
            currentLevel
          }
        })
      });

      if (response.ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("pending");
      }
    } catch (err) {
      console.error("[Sync Error]:", err);
      setSyncStatus("pending");
    }
  };

  // Trigger sync on local progress modifications
  const handleGrantXP = (xp: number) => {
    const nextPoints = points + xp;
    setPoints(nextPoints);
    persistLocal(completedLessons, customVocabulary, nextPoints);
    if (currentUser) {
      handleCloudSync(currentUser, completedLessons, customVocabulary, nextPoints);
    }
  };

  const handleAddNewWord = (word: VocabularyItem) => {
    const updatedVocab = [word, ...customVocabulary];
    setCustomVocabulary(updatedVocab);
    persistLocal(completedLessons, updatedVocab, points);
    if (currentUser) {
      handleCloudSync(currentUser, completedLessons, updatedVocab, points);
    }
  };

  const handleDeleteWord = (id: string) => {
    const updatedVocab = customVocabulary.filter((v) => v.id !== id);
    setCustomVocabulary(updatedVocab);
    persistLocal(completedLessons, updatedVocab, points);
    if (currentUser) {
      handleCloudSync(currentUser, completedLessons, updatedVocab, points);
    }
  };

  // Export Data backup to Local JSON
  const handleExportDataAsBackup = () => {
    const backupData = {
      completedLessons,
      customVocabulary,
      points,
      streakDays,
      level: currentLevel,
      lastActiveDate,
      exportedAt: new Date().toISOString()
    };

    const str = JSON.stringify(backupData, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `english_learner_backup_${currentUser || "guest"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Data Backup safely
  const handleImportRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.points !== undefined) {
          setCompletedLessons(data.completedLessons || []);
          setCustomVocabulary(data.customVocabulary || []);
          setPoints(data.points || 0);
          setStreakDays(data.streakDays || 1);
          setLevel(data.level || "beginner");
          
          persistLocal(data.completedLessons, data.customVocabulary, data.points);
          alert("Khôi phục danh sách học tập và dữ liệu tiến trình thành công!");
          
          if (currentUser) {
            handleCloudSync(currentUser, data.completedLessons, data.customVocabulary, data.points);
          }
        } else {
          alert("Tệp sao lưu không hợp lệ.");
        }
      } catch (err) {
        alert("Có lỗi khi đọc và nhập tệp sao lưu.");
      }
    };
    reader.readAsText(file);
  };

  // --- AUTH SERVICES ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authFields)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Giao thức liên kết lỗi.");
      }

      // Successful auth
      setCurrentUser(data.user.username);
      localStorage.setItem("app_learner_user", data.user.username);

      if (data.user.progress) {
        setCompletedLessons(data.user.progress.completedLessons || []);
        setCustomVocabulary(data.user.progress.customVocabulary || []);
        setPoints(data.user.progress.points || 0);
        persistLocal(data.user.progress.completedLessons, data.user.progress.customVocabulary, data.user.progress.points);
      }

      setShowAuthModal(false);
      setAuthFields({ username: "", password: "" });
      alert(data.message);
    } catch (err: any) {
      setAuthError(err.message || "Lỗi xử lý xác thực.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("app_learner_user");
    alert("Bạn đã đăng xuất tài khoản.");
  };

  // --- QUIZ & LESSON PRACTICES FLOW SERVICES ---
  const handleSelectLevelLesson = (lesson: LessonNode) => {
    setSelectedLesson(lesson);
    setLessonStep("prep");
    setCurrentQuizIndex(0);
    setQuizAnswer("");
    setQuizResult(null);
    setLessonFeedbackMsg("");
  };

  const handleCheckQuizAnswer = () => {
    if (!selectedLesson) return;
    const currentQuiz = selectedLesson.quizzes[currentQuizIndex];
    if (!quizAnswer.trim()) return;

    const formattedCorrect = currentQuiz.correctAnswer.trim().toLowerCase();
    const formattedUser = quizAnswer.trim().toLowerCase();

    if (formattedCorrect === formattedUser || (currentQuiz.type === "spelling" && formattedCorrect.includes(formattedUser))) {
      setQuizResult("correct");
      handleGrantXP(25); // Grant Points instantly
      setLessonFeedbackMsg("Chính xác! Cấu trúc ngữ pháp hoàn chỉnh.");
    } else {
      setQuizResult("incorrect");
      setLessonFeedbackMsg(`Chưa chính xác. Đáp án đúng phải là: "${currentQuiz.correctAnswer}"`);
    }
  };

  const handleNextQuiz = () => {
    if (!selectedLesson) return;
    setQuizAnswer("");
    setQuizResult(null);
    setLessonFeedbackMsg("");

    if (currentQuizIndex + 1 < selectedLesson.quizzes.length) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      // Completed all lesson quizzes!
      const nextCompleted = [...new Set([...completedLessons, selectedLesson.id])];
      setCompletedLessons(nextCompleted);
      persistLocal(nextCompleted, customVocabulary, points + 50); // lesson bonus points
      if (currentUser) {
        handleCloudSync(currentUser, nextCompleted, customVocabulary, points + 50);
      }
      setSelectedLesson(null);
      alert(`Chúc mừng! Bạn đã hoàn thành toàn bộ bài tập thực hành thiết lập cho: "${selectedLesson.title}". Tiếp tục thăng tiến nào!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-700 antialiased">
      {/* Top Navbar Header */}
      <Navbar
        currentLevel={currentLevel}
        setLevel={setLevel}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setAuthMode("login");
          setAuthError(null);
          setShowAuthModal(true);
        }}
        isOnline={isOnline}
        syncStatus={syncStatus}
        onTriggerSync={() => handleCloudSync()}
        onExportData={handleExportDataAsBackup}
        onImportData={handleImportRestoreData}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main vertical sidebar tab selectors */}
          <nav id="sidebar-navigation" className="lg:col-span-1 space-y-2 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm h-fit">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-3">Phòng Học Tập</span>
            
            {[
              { id: "roadmap", label: "Lộ trình học", icon: Map, color: "text-emerald-500 bg-emerald-50" },
              { id: "vocab", label: "Vở từ vựng", icon: BookOpen, color: "text-cyan-500 bg-cyan-50" },
              { id: "speaking", label: "Luyện phát âm", icon: Mic, color: "text-indigo-500 bg-indigo-50" },
              { id: "writing", label: "Luyện viết AI", icon: FileText, color: "text-rose-500 bg-rose-50" },
              { id: "chat", label: "Voice Chat AI", icon: MessageSquare, color: "text-purple-500 bg-purple-50" },
              { id: "game", label: "Từ vựng Game", icon: Gamepad2, color: "text-amber-500 bg-amber-50" }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`side-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedLesson(null); // auto quit open modal exercises
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-2xl transition text-xs font-semibold ${
                    active
                      ? "bg-emerald-500 text-white shadow-md font-bold"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${active ? "bg-white/20 text-white" : tab.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Core workspace dashboard panel */}
          <section id="main-workspace" className="lg:col-span-4 min-h-[500px]">
            {/* Active Lesson Quiz modal workflow (if active) */}
            {selectedLesson ? (
              <div id="lesson-interactive-modal" className="bg-white rounded-3xl border border-gray-150 p-6 shadow-md space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-mono">
                      Bài Thực Hành • {selectedLesson.level === "beginner" ? "Cơ bản" : selectedLesson.level === "intermediate" ? "Trung cấp" : "Nâng cao"}
                    </span>
                    <h2 className="text-base font-extrabold text-gray-800 mt-1">{selectedLesson.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-500 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {lessonStep === "prep" ? (
                  <div className="space-y-6 text-left">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Học từ mới trước khi thực hành</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Bấm biểu tượng âm lượng để tập đọc các từ vựng này trước khi bước vào giải đố.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CORE_VOCABULARY.filter(v => selectedLesson.vocabularyIds.includes(v.id)).map((vocab) => (
                        <div key={vocab.id} className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-extrabold font-serif text-emerald-800">{vocab.word}</h4>
                            <button
                              onClick={() => {
                                if ("speechSynthesis" in window) {
                                  window.speechSynthesis.cancel();
                                  const utterance = new SpeechSynthesisUtterance(vocab.word);
                                  utterance.lang = "en-US";
                                  window.speechSynthesis.speak(utterance);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-emerald-500 bg-white border rounded shadow-sm"
                            >
                              🔔
                            </button>
                          </div>
                          <p className="text-[10px] font-mono text-gray-400">{vocab.pronunciation}</p>
                          <p className="text-xs font-semibold text-gray-700">={vocab.meaningVi}</p>
                          <div className="text-[11px] bg-white p-2 rounded border border-gray-100 italic text-gray-500">
                            "{vocab.exampleEn}" ➔ {vocab.exampleVi}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setLessonStep("quiz")}
                        className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow flex items-center space-x-1.5"
                      >
                        <span>Sẵn sàng - Làm bài kiểm tra</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Quizzing
                  <div className="space-y-6 text-left max-w-xl mx-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 font-mono">
                        CÂU HỎI {currentQuizIndex + 1} / {selectedLesson.quizzes.length}
                      </span>
                      <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${((currentQuizIndex + 1) / selectedLesson.quizzes.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2.5xl border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-800">{selectedLesson.quizzes[currentQuizIndex].question}</h3>
                    </div>

                    {/* Question interactive space */}
                    {selectedLesson.quizzes[currentQuizIndex].options ? (
                      // Multiple choice layout
                      <div className="grid grid-cols-1 gap-2.5">
                        {selectedLesson.quizzes[currentQuizIndex].options?.map((opt, i) => (
                          <button
                            key={i}
                            id={`option-btn-${i}`}
                            onClick={() => {
                              if (quizResult === null) setQuizAnswer(opt);
                            }}
                            className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold border transition ${
                              quizAnswer === opt
                                ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                                : "bg-white border-gray-150 hover:bg-gray-50"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      // Text input (Spelling or translation)
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Điền đáp án chính xác tại đây..."
                          value={quizAnswer}
                          onChange={(e) => setQuizAnswer(e.target.value)}
                          className="w-full p-3.5 border border-gray-250 rounded-xl text-xs"
                        />
                        {selectedLesson.quizzes[currentQuizIndex].hint && (
                          <p className="text-[10px] text-gray-400 italic">
                            💡 Gợi ý: {selectedLesson.quizzes[currentQuizIndex].hint}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Feedback block */}
                    {quizResult && (
                      <div className={`p-4 rounded-xl text-xs font-semibold ${
                        quizResult === "correct" ? "bg-emerald-50 text-emerald-800 border" : "bg-rose-50 text-rose-800 border"
                      }`}>
                        {lessonFeedbackMsg}
                      </div>
                    )}

                    {/* Action buttons footer */}
                    <div className="flex justify-end pt-3 gap-3">
                      {quizResult === null ? (
                        <button
                          onClick={handleCheckQuizAnswer}
                          className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow"
                        >
                          Kiểm Tra Đáp Án
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuiz}
                          className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow flex items-center space-x-1.5"
                        >
                          <span>{currentQuizIndex + 1 === selectedLesson.quizzes.length ? "Hoàn Thành Bài Học" : "Câu Tiếp Theo"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Navigation content switcher panels
              <>
                {activeTab === "roadmap" && (
                  <Roadmap
                    currentLevel={currentLevel}
                    lessons={CORE_LESSONS}
                    completedLessons={completedLessons}
                    streakDays={streakDays}
                    points={points}
                    onSelectLesson={handleSelectLevelLesson}
                  />
                )}

                {activeTab === "vocab" && (
                  <VocabularyPanel
                    currentLevel={currentLevel}
                    coreVocabulary={CORE_VOCABULARY}
                    customVocabulary={customVocabulary}
                    onAddWord={handleAddNewWord}
                    onDeleteCustomWord={handleDeleteWord}
                  />
                )}

                {activeTab === "speaking" && (
                  <SpeakingCoach
                    vocabularyList={[...CORE_VOCABULARY, ...customVocabulary]}
                  />
                )}

                {activeTab === "writing" && (
                  <WritingStudio
                    points={points}
                    onGrantPoints={handleGrantXP}
                  />
                )}

                {activeTab === "chat" && (
                  <VoiceChat
                    onGrantPoints={handleGrantXP}
                  />
                )}

                {activeTab === "game" && (
                  <WordGame
                    vocabularyList={[...CORE_VOCABULARY, ...customVocabulary]}
                    onGrantPoints={handleGrantXP}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-medium">
        <p>© 2026 Luyện Nói & Viết Tiếng Anh AI. Hoạt động song hành chế độ offline và sao lưu ngoại tuyến.</p>
      </footer>

      {/* AUTHENTICATION FORM MODAL */}
      {showAuthModal && (
        <div id="auth-modal-screen" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-widest">
                {authMode === "login" ? "Đăng Nhập Tài Khoản" : "Đăng Ký Thành Viên"}
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">Đồng bộ đám mây và chia sẻ tiến độ học giữa nhiều thiết bị.</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500">Tên Đăng Nhập</label>
                <input
                  type="text"
                  required
                  value={authFields.username}
                  onChange={(e) => setAuthFields({ ...authFields, username: e.target.value })}
                  placeholder="Nhập tên tài khoản..."
                  className="w-full text-xs px-3.5 py-2 mt-1 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={authFields.password}
                  onChange={(e) => setAuthFields({ ...authFields, password: e.target.value })}
                  placeholder="Nhập mật khẩu..."
                  className="w-full text-xs px-3.5 py-2 mt-1 border border-gray-200 rounded-xl"
                />
              </div>

              {authError && (
                <div className="p-2 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] rounded">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                id="btn-auth-submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold transition shadow"
              >
                {authMode === "login" ? "Vào lớp ngay" : "Tạo tài khoản và học"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-gray-100">
              {authMode === "login" ? (
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError(null);
                  }}
                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  Bạn chưa có tài khoản? Đăng ký ngay
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                  }}
                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  Bạn đã có tài khoản sẵn? Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
