import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Smartphone, Maximize2, Monitor } from 'lucide-react';

export type DeviceMode = 'iphone' | 'pixel' | 'fullscreen';

interface Props {
  children: React.ReactNode;
  activeTabTitle?: string;
  isCapturing?: boolean;
  deckCount?: number;
  onOpenReactNativeCode?: () => void;
  onOpenExpoGo?: () => void;
}

export const MobileDeviceFrame: React.FC<Props> = ({
  children,
  activeTabTitle,
  isCapturing = false,
  deckCount = 0,
  onOpenReactNativeCode,
  onOpenExpoGo,
}) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('iphone');
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours % 12 || 12}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (deviceMode === 'fullscreen') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Floating Switcher Bar */}
        <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-400">⚡ SnapDeck AI</span>
            <span className="text-slate-400">React Native Engine</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenExpoGo && (
              <button
                onClick={onOpenExpoGo}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium cursor-pointer shadow flex items-center gap-1"
              >
                <span>📱 Expo Go</span>
              </button>
            )}
            {onOpenReactNativeCode && (
              <button
                onClick={onOpenReactNativeCode}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium cursor-pointer"
              >
                ⚛️ View React Native Code
              </button>
            )}
            <button
              onClick={() => setDeviceMode('iphone')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
            >
              📱 Mobile Frame
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8">
      {/* Top Simulator Control Bar */}
      <header className="w-full max-w-md sm:max-w-lg mb-3 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
            ⚡
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">SnapDeck AI</h1>
            <p className="text-[11px] text-slate-400">React Native / Expo Go</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenExpoGo && (
            <button
              onClick={onOpenExpoGo}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-950/50 transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-400/30 animate-pulse"
              title="Run on Expo Go on physical phone"
            >
              <span>📱 Open in Expo Go</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setDeviceMode('iphone')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                deviceMode === 'iphone' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="iPhone 16 Pro simulator"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">iPhone</span>
            </button>
            <button
              onClick={() => setDeviceMode('pixel')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                deviceMode === 'pixel' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Android Pixel simulator"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pixel</span>
            </button>
            <button
              onClick={() => setDeviceMode('fullscreen')}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Fullscreen view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Device Mockup */}
      <div
        className={`relative w-full max-w-[400px] h-[820px] max-h-[92vh] bg-black rounded-[52px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1),0_0_0_12px_#1e293b] flex flex-col overflow-hidden transition-all duration-300 ${
          deviceMode === 'pixel' ? 'rounded-[40px]' : ''
        }`}
      >
        {/* Device Outer Edge Bezel Reflections */}
        <div className="absolute inset-0 rounded-[50px] pointer-events-none ring-1 ring-white/20" />

        {/* Screen Display Container */}
        <div className="relative w-full h-full bg-slate-950 rounded-[42px] overflow-hidden flex flex-col border border-slate-800">
          {/* iOS Status Bar */}
          <div className="h-11 px-6 pt-2 flex items-center justify-between text-[13px] font-semibold text-white/90 z-30 select-none bg-slate-950/80 backdrop-blur-sm">
            <span className="w-12 tracking-tight">{currentTime}</span>

            {/* Dynamic Island / Camera Punch Hole */}
            {deviceMode === 'iphone' ? (
              <div className="relative h-[28px] px-3 bg-black rounded-full flex items-center justify-center gap-2 border border-white/10 shadow-inner">
                {isCapturing ? (
                  <span className="flex items-center gap-1.5 text-[10px] text-amber-400 animate-pulse font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    AI Analyzing...
                  </span>
                ) : deckCount > 0 ? (
                  <span className="text-[10px] text-sky-400 font-medium">
                    {activeTabTitle || 'SnapDeck'}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-white/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                  </div>
                )}
              </div>
            ) : (
              /* Pixel Camera Cutout */
              <div className="w-3.5 h-3.5 rounded-full bg-black ring-1 ring-white/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              </div>
            )}

            <div className="w-12 flex items-center justify-end gap-1.5 text-white/80">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Screen Content Viewport */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}
          </div>

          {/* Native Home Indicator Bar */}
          <div className="h-5 flex items-center justify-center bg-slate-950 select-none pointer-events-none">
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Simulator Bottom Actions */}
      <footer className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <span>Model: <strong className="text-slate-200">Gemini 3.8 Flash</strong></span>
        <span>•</span>
        {onOpenExpoGo && (
          <button
            onClick={onOpenExpoGo}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 cursor-pointer flex items-center gap-1"
          >
            📱 Run in Expo Go
          </button>
        )}
        <span>•</span>
        {onOpenReactNativeCode && (
          <button
            onClick={onOpenReactNativeCode}
            className="text-sky-400 hover:text-sky-300 font-medium underline underline-offset-2 cursor-pointer flex items-center gap-1"
          >
            ⚛️ React Native Code
          </button>
        )}
      </footer>
    </div>
  );
};
