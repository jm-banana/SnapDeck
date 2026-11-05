import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, CheckCircle2, AlertCircle, FileText, Zap } from 'lucide-react';
import { SAMPLE_NOTES, SampleNoteInfo } from '../data/sampleNotes';
import { NoteSheetPreview } from './NoteSheetPreview';
import { compressImage } from '../utils/imageCompressor';
import { sound } from '../utils/audio';

interface Props {
  onCapture: (imageData: { base64?: string; sampleId?: string; sampleNote?: SampleNoteInfo; notesText?: string }) => void;
  isProcessing: boolean;
  processingStep?: string;
}

export const CameraViewfinder: React.FC<Props> = ({
  onCapture,
  isProcessing,
  processingStep = 'Analyzing notes...',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleNoteInfo | null>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Initialize camera stream
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      // Stop any existing tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (isMounted) setHasCameraPermission(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasCameraPermission(true);
      } catch (err) {
        console.warn('Camera access error or permission denied:', err);
        if (isMounted) {
          setHasCameraPermission(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Flip front / rear camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture current video frame to base64
  const handleSnap = async () => {
    sound.playShutter();

    if (selectedSample) {
      onCapture({ sampleId: selectedSample.id, sampleNote: selectedSample });
      return;
    }

    if (!videoRef.current || !hasCameraPermission) {
      // If camera stream is not active, prompt to upload their actual photo
      fileInputRef.current?.click();
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth || 1280, 1600);
    canvas.height = Math.min(video.videoHeight || 720, 1600);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.82);
      setCapturedPreview(base64);
      onCapture({ base64 });
    }
  };

  // Upload photo from device library
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playShutter();
    try {
      const compressed = await compressImage(file, 1600, 0.82);
      setCapturedPreview(compressed);
      setSelectedSample(null);
      onCapture({ base64: compressed });
    } catch (err) {
      console.error('Error compressing uploaded note:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Submit pasted text notes
  const handlePastedSubmit = () => {
    if (!pastedText.trim() || pastedText.trim().length < 15) return;
    sound.playShutter();
    setIsTextModalOpen(false);
    setSelectedSample(null);
    onCapture({ notesText: pastedText.trim() });
  };

  // Pick sample note
  const handleSelectSample = (sample: SampleNoteInfo) => {
    sound.playShutter();
    setSelectedSample(sample);
    setCapturedPreview(sample.previewUrl);
    onCapture({ sampleId: sample.id, sampleNote: sample });
  };

  return (
    <div className="relative flex-1 bg-black flex flex-col justify-between overflow-hidden select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload textbook or note photo"
      />

      {/* Camera Header Banner */}
      <div className="relative z-20 px-4 pt-2 pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-white uppercase">AI Study Camera</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            20 Cards Deck
          </div>
          {hasCameraPermission && (
            <button
              onClick={toggleFacingMode}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all cursor-pointer"
              title="Flip camera"
              aria-label="Flip camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewfinder Surface */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {selectedSample ? (
          // Sample Preview Active
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-xs">
              <NoteSheetPreview sample={selectedSample} />
            </div>
            <div className="mt-3 flex items-center justify-between w-full max-w-xs px-2 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-xs">
              <div>
                <p className="font-semibold text-white">{selectedSample.name}</p>
                <p className="text-[10px] text-sky-400">{selectedSample.cardCount} High-Accuracy Cards</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSample(null);
                  setCapturedPreview(null);
                }}
                className="text-[11px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        ) : hasCameraPermission ? (
          // Live Video Feed
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Document Scan Frame & Grid Reticle */}
            <div className="absolute inset-4 sm:inset-6 border border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />

              {/* Animated laser scanning line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse my-auto" />

              <div className="self-center bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[11px] font-medium text-white/90">
                Align textbook page or notes inside frame
              </div>
            </div>
          </div>
        ) : (
          // Camera permission fallback / Desktop view with simulated sample notes
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-white font-bold text-base mb-1">Camera Ready</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Snap a photo with camera, upload a photo of your notes, or pick one of the sample study sheets below:
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer mb-4"
            >
              <Upload className="w-4 h-4" />
              Upload Notes / Textbook Photo
            </button>
          </div>
        )}

        {/* Processing / Extraction Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-sky-400 animate-pulse" />
              </div>
            </div>

            <h4 className="text-white font-bold text-lg mb-1">Generating 20 Flashcards</h4>
            <p className="text-xs text-sky-400 font-mono mb-4 animate-pulse">{processingStep}</p>

            <div className="w-64 space-y-2 text-left text-xs bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reading handwritten & textbook notes</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Extracting core testable concepts</span>
              </div>
              <div className="flex items-center gap-2 text-sky-400 animate-pulse">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin inline-block" />
                <span>Formulating active-recall flashcards</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-800 inline-block" />
                <span>Verifying factual evidence citations</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-20 px-4 pt-3 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-3">
        {/* Sample Notes Selector Strip */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
            <span>Or try a realistic student note:</span>
            <span className="text-sky-400 font-medium">1-Tap Extract</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {SAMPLE_NOTES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                disabled={isProcessing}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSample?.id === sample.id
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-base mb-0.5">{sample.icon}</div>
                <div className="text-[11px] font-semibold truncate leading-tight">{sample.name}</div>
                <div className="text-[9px] text-slate-400 truncate">{sample.badge}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Shutter Action Row */}
        <div className="flex items-center justify-between px-3 pt-1">
          {/* Gallery / File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 flex flex-col items-center justify-center text-slate-300 transition-all cursor-pointer shadow-md active:scale-95"
            title="Upload from photo library"
            aria-label="Upload note photo"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wider text-slate-400">Photo</span>
          </button>

          {/* Paste Text / Typed Notes Button */}
          <button
            onClick={() => setIsTextModalOpen(true)}
            disabled={isProcessing}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 flex flex-col items-center justify-center text-slate-300 transition-all cursor-pointer shadow-md active:scale-95"
            title="Paste typed notes or textbook text"
            aria-label="Paste text notes"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wider text-slate-400">Paste</span>
          </button>

          {/* Big Tactile Shutter Button */}
          <div className="relative flex flex-col items-center">
            <button
              onClick={handleSnap}
              disabled={isProcessing}
              className="w-20 h-20 rounded-full bg-white/20 p-1.5 backdrop-blur-sm border-2 border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 transition-all cursor-pointer group"
              aria-label="Snap picture to generate 20 flashcards"
            >
              <div className="w-full h-full rounded-full bg-white group-hover:bg-sky-50 group-active:scale-90 transition-transform shadow-inner flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-slate-900" />
              </div>
            </button>
            <span className="text-[10px] font-bold text-white/90 mt-1.5 tracking-wide">
              SNAP 20 CARDS
            </span>
          </div>

          {/* Quick Biology default snap */}
          <button
            onClick={() => handleSelectSample(SAMPLE_NOTES[0])}
            disabled={isProcessing}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 flex flex-col items-center justify-center text-slate-300 transition-all cursor-pointer shadow-md active:scale-95"
            title="Instant Demo Deck"
            aria-label="Instant Demo Deck"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wider text-slate-400">Sample</span>
          </button>
        </div>
      </div>

      {/* Paste Notes Text Modal */}
      {isTextModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end p-3 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl flex flex-col max-h-[85%]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h4 className="text-white font-bold text-sm">Paste Notes or Textbook Text</h4>
              </div>
              <button
                onClick={() => setIsTextModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 my-2">
              Paste your messy lecture notes, syllabus terms, or textbook paragraphs. We will extract 20 active-recall flashcards with citations.
            </p>

            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. Chapter 4: Photosynthesis occurs in chloroplasts. Light reactions produce ATP and NADPH. The Calvin cycle fixes CO2 into glucose..."
              className="w-full flex-1 min-h-[140px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-none"
            />

            <div className="flex items-center justify-between mt-3 pt-2">
              <span className="text-[10px] text-slate-400">
                {pastedText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTextModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePastedSubmit}
                  disabled={pastedText.trim().length < 15}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate 20 Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
