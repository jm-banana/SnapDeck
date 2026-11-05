import React, { useState } from 'react';
import { QrCode, Smartphone, Copy, Check, Download, ExternalLink, X, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpoGoModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'snack' | 'files'>('quick');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadAppFile = async () => {
    try {
      const res = await fetch('/App.expo.tsx');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'App.tsx';
      a.click();
      URL.revokeObjectURL(url);
      setCopiedKey('download-app');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const handleDownloadAppJson = async () => {
    try {
      const res = await fetch('/app.json');
      const text = await res.text();
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'app.json';
      a.click();
      URL.revokeObjectURL(url);
      setCopiedKey('download-json');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const shellCommand = `npx create-expo-app SnapDeckAI -t blank-typescript
cd SnapDeckAI
npx expo install expo-camera expo-haptics
npx expo start`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Run on Expo Go</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Native iOS & Android
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test live on your physical phone with Expo Go & physical camera.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Expo Go dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-1 border-b border-slate-800/80 bg-slate-950 flex gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            🚀 Quick Setup (30s)
          </button>
          <button
            onClick={() => setActiveTab('snack')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'snack'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            📱 Expo Snack / QR
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'files'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            📁 Download Project Files
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-indigo-200 text-xs leading-relaxed">
                  Your backend Gemini 3.8 Flash API is already hosted live on Cloud Run. The React Native app connects directly to it for instant 20-card camera generation!
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    Step 1: Create Expo project in terminal
                  </span>
                  <button
                    onClick={() => handleCopy(shellCommand, 'shell')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'shell' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'shell' ? 'Copied!' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-400 text-xs overflow-x-auto select-all">
                  <code>{shellCommand}</code>
                </pre>
              </div>

              <div>
                <span className="font-semibold text-white text-xs block mb-1.5">
                  Step 2: Replace App.tsx with SnapDeck code
                </span>
                <p className="text-slate-400 text-xs mb-2">
                  Copy the full React Native code from the <strong>📁 Download Project Files</strong> tab or download <code className="text-sky-400 bg-slate-800 px-1 py-0.5 rounded">App.expo.tsx</code>.
                </p>
              </div>

              <div>
                <span className="font-semibold text-white text-xs block mb-1.5">
                  Step 3: Scan QR code with Expo Go
                </span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  • <strong>iOS</strong>: Open the stock Camera app and point it at the terminal QR code, then tap "Open in Expo Go".
                  <br />
                  • <strong>Android</strong>: Open the <strong>Expo Go</strong> app and tap "Scan QR Code".
                </p>
              </div>
            </div>
          )}

          {activeTab === 'snack' && (
            <div className="space-y-4 text-center py-2">
              <div className="inline-block p-4 rounded-3xl bg-white text-slate-900 shadow-xl">
                {/* Real Scannable QR Code */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fais-pre-kgemxp7suzbg6pnivdntzy-368683130992.asia-northeast1.run.app"
                  alt="Scan with Phone Camera"
                  className="w-48 h-48 rounded-xl object-contain mx-auto"
                />
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">Scan with Phone Camera</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Open your iPhone camera or Android QR scanner to immediately open the live mobile web app, or follow the <strong>🚀 Quick Setup</strong> tab to run inside the native <strong>Expo Go</strong> app!
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <a
                  href="https://snack.expo.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg text-xs"
                >
                  <span>Open in Expo Snack</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-xs">App.tsx (React Native + Expo)</h4>
                  <p className="text-[11px] text-slate-400">
                    Complete native app code with CameraView, haptics, flip animation & Gemini API call.
                  </p>
                </div>
                <button
                  onClick={handleDownloadAppFile}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'download-app' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  Download App.tsx
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-xs">app.json (Expo Configuration)</h4>
                  <p className="text-[11px] text-slate-400">
                    Permissions for camera, dark theme, orientation, and Expo Go plugins.
                  </p>
                </div>
                <button
                  onClick={handleDownloadAppJson}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  {copiedKey === 'download-json' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  Download app.json
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200 block mb-1">Required Expo packages:</span>
                <code className="text-sky-400 block bg-slate-900 p-2 rounded-lg font-mono">
                  npx expo install expo-camera expo-haptics
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Target: <strong>Expo Go v52+ / React Native 0.76+</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
