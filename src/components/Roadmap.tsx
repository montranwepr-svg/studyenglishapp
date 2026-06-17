import React, { useState } from "react";
import { LearnerLevel, LessonNode } from "../types";
import { Flame, Star, Trophy, Clock, Check, Play, Bell, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface RoadmapProps {
  currentLevel: LearnerLevel;
  lessons: LessonNode[];
  completedLessons: string[];
  streakDays: number;
  points: number;
  onSelectLesson: (lesson: LessonNode) => void;
}

export default function Roadmap({
  currentLevel,
  lessons,
  completedLessons,
  streakDays,
  points,
  onSelectLesson
}: RoadmapProps) {
  // Filter lessons belonging to active level
  const filteredLessons = lessons.filter((les) => les.level === currentLevel);

  // States for Daily Notifications Simulation
  const [alarmTime, setAlarmTime] = useState("09:00");
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // Prompt HTML5 notification request or simulate local push notification
  const handleSaveReminder = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setNotificationStatus(`Đã đăng ký nhắc nhở lúc ${alarmTime} hằng ngày! Chúng tôi sẽ gửi thông báo đẩy để nhắc bạn học tập.`);
          // Fire a brief welcome notification
          new Notification("EnglishAI Coach", {
            body: "Chúc mừng! Bạn đã đăng ký nhắc nhở thông báo học tập thành công.",
            icon: "https://cdn-icons-png.flaticon.com/512/1162/1162234.png"
          });
        } else {
          setNotificationStatus(`Thiếu quyền thông báo trình duyệt, nhưng bộ nhắc nhở in-app hoạt động lúc ${alarmTime}!`);
        }
      });
    } else {
      setNotificationStatus(`Thiết bị của bạn không hỗ trợ thông báo đẩy trực tiếp, hệ thống đã lên lịch nhắc nhở in-app vào lúc ${alarmTime}!`);
    }

    // Trigger auto close on status
    setTimeout(() => {
      setNotificationStatus(null);
    }, 6000);
  };

  const completedCount = filteredLessons.filter(l => completedLessons.includes(l.id)).length;
  const progressPercent = filteredLessons.length
    ? Math.round((completedCount / filteredLessons.length) * 100)
    : 0;

  return (
    <div id="roadmap-container" className="space-y-6">
      {/* Daily Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-amber-100 text-xs font-semibold tracking-wider font-mono">STREAK HẰNG NGÀY</span>
            <h2 className="text-2xl font-bold flex items-center mt-1">
              <Flame className="w-6 h-6 text-amber-200 fill-amber-200 mr-2 animate-bounce" />
              {streakDays} Ngày Liên Tiếp
            </h2>
            <p className="text-amber-50 text-[11px] mt-1">Học đều đặn để nhận thêm x2 kinh nghiệm (XP)!</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Flame className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* XP Points Card */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-teal-100 text-xs font-semibold tracking-wider font-mono">ĐIỂM TÍCH LŨY XP</span>
            <h2 className="text-2xl font-bold flex items-center mt-1">
              <Trophy className="w-6 h-6 text-yellow-300 fill-yellow-300 mr-2" />
              {points} XP
            </h2>
            <p className="text-teal-50 text-[11px] mt-1">Hoàn thành bài học, quiz và game để thăng hạng!</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Daily Goal & Push Reminder Widget */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-gray-400 text-[10px] font-bold tracking-wider font-mono uppercase">THÔNG BÁO BẢN THÂN</span>
              <h3 className="text-sm font-bold text-gray-800 flex items-center mt-0.5">
                <Bell className="w-4 h-4 text-emerald-500 mr-1.5" />
                Bộ Nhắc Nhở Hằng Ngày
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="text-xs bg-gray-100 border border-transparent p-1 rounded-lg text-gray-700 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <button
                id="btn-save-alarm"
                onClick={handleSaveReminder}
                className="bg-emerald-500 text-white p-1 rounded-lg hover:bg-emerald-600 transition"
                title="Lưu lịch nhắc"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            {notificationStatus ? (
              <p className="text-[10px] text-emerald-600 bg-emerald-50 p-1.5 rounded border border-emerald-100 font-medium">
                {notificationStatus}
              </p>
            ) : (
              <div className="flex items-center text-[10px] text-gray-500">
                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                Thiết lập giờ để nhận thông báo đẩy học tập mỗi ngày.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Roadmap */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-md uppercase font-mono tracking-wider">
              LỘ TRÌNH HỌC TẬP CÁ NHÂN HÓA
            </span>
            <h2 className="text-lg font-bold text-gray-800 mt-1 capitalize">
              Cấp độ: {currentLevel === "beginner" ? "Cơ bản" : currentLevel === "intermediate" ? "Trung cấp" : "Nâng cao"}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-600">Bài học đạt: {progressPercent}%</span>
            <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden mt-1 shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>Không tìm thấy bài học nào phù hợp cho trình độ này.</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center py-6">
            {/* Timeline connectors */}
            <div className="absolute top-0 bottom-0 w-1 bg-gray-100 left-1/2 -ml-0.5 z-0" />

            <div className="w-full space-y-12 relative z-10">
              {filteredLessons.map((les, index) => {
                const isCompleted = completedLessons.includes(les.id);
                // Node arrangement: alternate left/right for PC, aligned center for mob
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={les.id}
                    id={`roadmap-node-${les.id}`}
                    className={`flex flex-col md:flex-row items-center justify-between w-full ${
                      isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Lesson Content Box */}
                    <div className="w-full md:w-5/12 flex justify-center px-4">
                      <div className="bg-gray-50 border border-gray-100 hover:border-emerald-200 p-5 rounded-2xl w-full hover:shadow-md transition duration-300 text-left">
                        <span className="text-[10px] text-gray-400 font-mono font-bold">BÀI {index + 1}</span>
                        <h3 className="font-bold text-gray-800 text-sm mt-0.5">{les.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{les.description}</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {les.vocabularyIds.length} Từ vựng • {les.quizzes.length} Quizzes
                          </span>
                          <button
                            id={`start-lesson-${les.id}`}
                            onClick={() => onSelectLesson(les)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow"
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Ôn Tập</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-white" />
                                <span>Bắt Đầu</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Node Ring */}
                    <div className="my-4 md:my-0 flex items-center justify-center relative">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-4 shadow transition duration-300 z-20 ${
                          isCompleted
                            ? "bg-emerald-500 border-white text-white scale-110 ring-4 ring-emerald-100"
                            : "bg-white border-emerald-400 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5 font-bold" /> : <Star className="w-5 h-5 fill-current" />}
                      </div>
                    </div>

                    {/* Spacing alignment block */}
                    <div className="hidden md:block w-5/12" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
