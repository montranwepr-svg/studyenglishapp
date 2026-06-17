import React, { useState, useEffect } from "react";
import { VocabularyItem } from "../types";
import { Puzzle, RefreshCw, Award, Play, CheckCircle, HelpCircle, AlertCircle } from "lucide-react";

interface WordGameProps {
  vocabularyList: VocabularyItem[];
  onGrantPoints: (xp: number) => void;
}

interface GameCard {
  id: string; // duplicate id + prefix
  label: string;
  matchId: string; // vocab id
  type: "en" | "vi";
  isMatched: boolean;
}

export default function WordGame({ vocabularyList, onGrantPoints }: WordGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "completed">("idle");
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem("matching_game_high_score")) || 0;
  });

  // Load appropriate vocabulary matching pool
  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameState("completed");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Handle high score updates
  useEffect(() => {
    if (gameState === "completed" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("matching_game_high_score", score.toString());
      // Grant extra bonus on high score!
      onGrantPoints(score);
    } else if (gameState === "completed" && score > 0) {
      onGrantPoints(Math.round(score * 0.5));
    }
  }, [gameState]);

  const startGame = () => {
    if (vocabularyList.length < 4) {
      alert("Học tối thiểu 4 từ vựng trong vở từ vựng để kích hoạt trò chơi phản xạ!");
      return;
    }

    // Pick 5 random words
    const shuffledPool = [...vocabularyList].sort(() => 0.5 - Math.random());
    const selectedWords = shuffledPool.slice(0, 6);

    const enCards: GameCard[] = selectedWords.map(w => ({
      id: `en_${w.id}`,
      label: w.word,
      matchId: w.id,
      type: "en",
      isMatched: false
    }));

    const viCards: GameCard[] = selectedWords.map(w => ({
      id: `vi_${w.id}`,
      label: w.meaningVi,
      matchId: w.id,
      type: "vi",
      isMatched: false
    }));

    // Shuffle combined cards
    const combined = [...enCards, ...viCards].sort(() => 0.5 - Math.random());
    setCards(combined);
    setSelectedCards([]);
    setScore(0);
    setTimer(35);
    setGameState("playing");
  };

  const handleCardClick = (card: GameCard) => {
    if (card.isMatched || selectedCards.find(c => c.id === card.id)) return;

    const updatedSelected = [...selectedCards, card];
    setSelectedCards(updatedSelected);

    if (updatedSelected.length === 2) {
      const [first, second] = updatedSelected;

      // Check match conditions
      if (first.matchId === second.matchId && first.type !== second.type) {
        // Matched successfully
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.matchId === first.matchId ? { ...c, isMatched: true } : c)));
          setScore(prev => prev + 15);
          setSelectedCards([]);

          // Check if all matched
          setCards(prevCurrent => {
            const allMatch = prevCurrent.every(c => c.matchId === first.matchId ? true : c.isMatched);
            if (allMatch) {
              setGameState("completed");
            }
            return prevCurrent;
          });
        }, 300);
      } else {
        // Mis-match flash reset
        setTimeout(() => {
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  return (
    <div id="word-game-container" className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm max-w-3xl mx-auto space-y-6 text-center">
      <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-100 gap-4">
        <div className="flex items-center space-x-2 text-left">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Puzzle className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-800">GAME: GHÉP TỪ PHẢN XẠ</h3>
            <p className="text-[10px] text-gray-400">Match English vocabulary word cards with correct translation meanings.</p>
          </div>
        </div>

        {gameState === "playing" && (
          <div className="flex gap-4">
            <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-800 font-bold block leading-none font-mono uppercase">THỜI GIAN</span>
              <span className="text-sm font-extrabold text-amber-900 font-mono">{timer}s</span>
            </div>

            <div className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              <span className="text-[10px] text-teal-800 font-bold block leading-none font-mono uppercase">ĐIỂM SỐ</span>
              <span className="text-sm font-extrabold text-teal-900 font-mono">+{score} XP</span>
            </div>
          </div>
        )}
      </div>

      {gameState === "idle" && (
        <div className="py-10 space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Puzzle className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h4 className="font-extrabold text-base text-gray-800">Cơ Chế Lật Ghép Từ Vựng</h4>
            <p className="text-xs text-gray-500 leading-relaxed text-center">
              Chọn một từ khóa tiếng Anh và lật mặt nghĩa Tiếng Việt tương ứng nhanh nhất có thể. Mỗi cặp ghép khớp mang lại +15 XP. Đua điểm kỷ lục cá nhân ngay hôm nay!
            </p>
          </div>

          {highScore > 0 && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs font-bold rounded-full">
              <Award className="w-4 h-4 text-yellow-600" />
              <span>Điểm cao kỷ lục: {highScore} XP</span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-start-game-reflex"
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 mx-auto"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>BẮT ĐẦU CHƠI (+XP THĂNG HẠNG)</span>
            </button>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
          {cards.map((card) => {
            const isSelected = selectedCards.some(c => c.id === card.id);
            return (
              <button
                key={card.id}
                id={`game-card-${card.id}`}
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched}
                className={`p-4 rounded-2xl border text-xs font-semibold h-20 flex items-center justify-center transition duration-300 shadow-sm active:scale-95 ${
                  card.isMatched
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 opacity-40 line-through cursor-not-allowed"
                    : isSelected
                    ? "bg-amber-500 text-white border-amber-400 font-extrabold ring-4 ring-amber-100 scale-102"
                    : "bg-white border-gray-150 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                }`}
              >
                <span className="text-center hyphens-auto leading-tight">{card.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {gameState === "completed" && (
        <div className="py-10 space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-gray-800">HẾT GIỜ! HOÀN THÀNH</h4>
            <p className="text-xs text-gray-500">Bạn đã dọn sạch bảng và hoàn chỉnh phản xạ từ vựng!</p>
          </div>

          <div className="bg-gray-50 max-w-xs mx-auto p-4 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-600">
              <span>ĐIỂM ĐẠT ĐƯỢC:</span>
              <span className="font-mono text-emerald-600 font-bold">+{score} XP</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 border-t pt-1.5">
              <span>KỶ LỤC CỦA BẠN:</span>
              <span className="font-mono text-amber-600 font-bold">{highScore} XP</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={startGame}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Chơi lại ván mới</span>
            </button>
            <button
              onClick={() => setGameState("idle")}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition"
            >
              Thoát game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
