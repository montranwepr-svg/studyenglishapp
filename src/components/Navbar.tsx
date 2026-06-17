import React, { useState } from "react";
import { LearnerLevel } from "../types";
import { BookOpen, RefreshCw, Key, LogOut, CheckCircle, AlertTriangle, Download, Upload, Globe } from "lucide-react";

interface NavbarProps {
  currentLevel: LearnerLevel;
  setLevel: (lvl: LearnerLevel) => void;
  currentUser: string | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  isOnline: boolean;
  syncStatus: "synced" | "pending" | "offline";
  onTriggerSync: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Navbar({
  currentLevel,
  setLevel,
  currentUser,
  onLogout,
  onOpenAuth,
  isOnline,
  syncStatus,
  onTriggerSync,
  onExportData,
  onImportData
}: NavbarProps) {
  return (
    <header id="app-header" className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl text-white shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent leading-none">
                EnglishAI
              </h1>
              <span className="text-[10px] text-gray-500 font-mono">SPEAK & WRITE COACH</span>
            </div>
          </div>

          {/* Level Switcher */}
          <div className="hidden md:flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
            {(["beginner", "intermediate", "advanced"] as LearnerLevel[]).map((lvl) => (
              <button
                key={lvl}
                id={`lvl-btn-${lvl}`}
                onClick={() => setLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  currentLevel === lvl
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {lvl === "beginner" ? "Cơ bản" : lvl === "intermediate" ? "Trung cấp" : "Nâng cao"}
              </button>
            ))}
          </div>

          {/* Account Sync & Sync State */}
          <div className="flex items-center space-x-3">
            {/* Sync Badge */}
            <div className="flex items-center space-x-2">
              {syncStatus === "synced" && (
                <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3 mr-1" /> Đã đồng bộ
                </span>
              )}
              {syncStatus === "pending" && (
                <button
                  id="sync-btn-pending"
                  onClick={onTriggerSync}
                  className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 animate-pulse transition"
                  title="Nhấn để đồng bộ lên máy chủ"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Có thay đổi mới
                </button>
              )}
              {syncStatus === "offline" && (
                <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Ngoại tuyến
                </span>
              )}
            </div>

            {/* Backup & Restore buttons */}
            <div className="flex items-center space-x-1 border-r border-gray-100 pr-2">
              <button
                id="btn-export-data"
                onClick={onExportData}
                title="Sao lưu vào máy (.json)"
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
              </button>
              <label
                id="label-import-data"
                title="Khôi phục từ file sao lưu"
                className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-gray-800">{currentUser}</p>
                  <p className="text-[9px] text-emerald-500">Đã đăng nhập</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  {currentUser.charAt(0).toUpperCase()}
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-open"
                onClick={onOpenAuth}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
