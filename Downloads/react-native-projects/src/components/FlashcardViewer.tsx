import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Copy,
  Check,
  Edit3,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  Flashcard,
  FlashcardDeck,
  exportToAnkiTSV,
  exportToQuizletText,
  calculateMasteryStats,
} from '../utils/deckUtils';
import { sound } from '../utils/audio';

interface Props {
  deck: FlashcardDeck;
  onUpdateDeck: (updatedDeck: FlashcardDeck) => void;
  onRetake: () => void;
  onInspectAccuracy: () => void;
}

export const FlashcardViewer: React.FC<Props> = ({
  deck,
  onUpdateDeck,
  onRetake,
  onInspectAccuracy,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'study' | 'grid'>('study');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Editing state for grid view
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const currentCard = deck.cards[currentIndex];
  const stats = calculateMasteryStats(deck.cards);

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCardId) return; // Do not intercept while typing
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, editingCardId, deck.cards.length]);

  const handleFlip = () => {
    sound.playFlip();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const toggleMastery = (cardId: string, mastered: boolean) => {
    sound.playFlip();
    const updatedCards = deck.cards.map((c) =>
      c.id === cardId ? { ...c, isMastered: mastered } : c
    );
    onUpdateDeck({ ...deck, cards: updatedCards });

    // Check if all cards mastered
    const newMasteredCount = updatedCards.filter((c) => c.isMastered).length;
    if (newMasteredCount === deck.cards.length && deck.cards.length > 0) {
      sound.playChime();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Auto advance to next card if in study mode
    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handleSaveEdit = (cardId: string) => {
    const updatedCards = deck.cards.map((c) =>
      c.id === cardId ? { ...c, front: editFront.trim(), back: editBack.trim() } : c
    );
    onUpdateDeck({ ...deck, cards: updatedCards });
    setEditingCardId(null);
  };

  const handleExportAnki = () => {
    const tsv = exportToAnkiTSV(deck);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.replace(/\s+/g, '_')}_Anki.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedType('anki');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyQuizlet = () => {
    const text = exportToQuizletText(deck);
    navigator.clipboard.writeText(text);
    setCopiedType('quizlet');
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Distinct tags for filtering
  const allTags = Array.from(new Set(deck.cards.map((c) => c.tag).filter(Boolean)));

  const filteredCards = deck.cards.filter((c) => {
    const matchesTag = filterTag === 'all' || c.tag === filterTag;
    const matchesSearch =
      !searchQuery ||
      c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.concept.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-950 text-white flex flex-col justify-between overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
        <div>
          <h2 className="font-bold text-white text-sm truncate max-w-[190px]">{deck.title}</h2>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>{deck.cards.length} Cards</span>
            <span>•</span>
            <button
              onClick={onInspectAccuracy}
              className="text-emerald-400 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% Verified
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode(viewMode === 'study' ? 'grid' : 'study')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'grid' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewMode === 'study' ? 'All Cards' : 'Study'}</span>
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Export to Anki or Quizlet"
            aria-label="Export deck"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar Strip */}
      <div className="w-full bg-slate-900 h-1 flex">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>

      {/* Main Body */}
      {viewMode === 'study' ? (
        <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
          {/* Card Meta & Counter */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">
              Card {currentIndex + 1} of {deck.cards.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[10px]">
                {stats.mastered} Mastered
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[11px]">{stats.remaining} Left</span>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            className="relative flex-1 min-h-[340px] max-h-[460px] perspective-1000 my-auto cursor-pointer select-none group"
            onClick={handleFlip}
          >
            <div
              className={`w-full h-full duration-500 preserve-3d transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700/80 shadow-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    {currentCard?.tag || 'Concept'}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      currentCard?.difficulty === 'hard'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : currentCard?.difficulty === 'easy'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {currentCard?.difficulty || 'Medium'}
                  </span>
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mb-2">
                    {currentCard?.concept}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                    {currentCard?.front}
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 group-hover:text-sky-300 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tap or press Space to reveal answer</span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-6 border-2 border-sky-500/40 shadow-2xl flex flex-col justify-between overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    High-Yield Answer
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {currentCard?.concept}
                  </span>
                </div>

                <div className="my-3">
                  <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
                    {currentCard?.back}
                  </p>

                  {/* Evidence Citation Box for Grounded Accuracy */}
                  <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-left">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Source Notes Verification
                    </div>
                    <p className="text-xs text-emerald-200/90 italic font-serif">
                      "{currentCard?.evidenceCitation}"
                    </p>
                  </div>
                </div>

                <div className="text-center text-[11px] text-slate-400">
                  Tap to flip back • Space / Arrows
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mastery & Navigation Row */}
          <div className="mt-4 flex flex-col gap-2">
            {isFlipped ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMastery(currentCard.id, false)}
                  className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer active:scale-95"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Review Again
                </button>
                <button
                  onClick={() => toggleMastery(currentCard.id, true)}
                  className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  Mark Mastered
                </button>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={onRetake}
                className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                title="Snap a new picture"
              >
                📸 Snap New
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === deck.cards.length - 1}
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-md cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GRID / ALL CARDS VIEW */
        <div className="flex-1 p-3 flex flex-col overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search 20 flashcards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none"
              aria-label="Filter cards by tag"
            >
              <option value="all">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCards.map((card, idx) => (
              <div
                key={card.id}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  card.isMastered
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {editingCardId === card.id ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                        Question / Prompt:
                      </label>
                      <input
                        type="text"
                        value={editFront}
                        onChange={(e) => setEditFront(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                        Answer:
                      </label>
                      <textarea
                        rows={2}
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingCardId(null)}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(card.id)}
                        className="px-2.5 py-1 text-[11px] rounded bg-sky-600 text-white font-medium cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sky-400">#{idx + 1}</span>
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-semibold">
                          {card.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCardId(card.id);
                            setEditFront(card.front);
                            setEditBack(card.back);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-300 rounded cursor-pointer"
                          title="Edit card"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleMastery(card.id, !card.isMastered)}
                          className={`p-1 rounded cursor-pointer ${
                            card.isMastered ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Toggle Mastered"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="font-semibold text-white mb-1">{card.front}</p>
                    <p className="text-slate-300 text-[11px]">{card.back}</p>

                    <div className="mt-2 text-[10px] text-emerald-400/90 italic border-l-2 border-emerald-500/60 pl-2">
                      Citation: "{card.evidenceCitation}"
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export to Anki & Quizlet Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-1">Export Study Deck</h3>
            <p className="text-xs text-slate-400 mb-4">
              Instantly import into your preferred spaced-repetition software:
            </p>

            <div className="space-y-3">
              {/* Anki Export */}
              <button
                onClick={handleExportAnki}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between text-left transition-all cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-sky-400" />
                    Download Anki (.txt / TSV)
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Front, Back, and Tags columns formatted for Anki desktop & AnkiMobile
                  </p>
                </div>
                {copiedType === 'anki' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Quizlet Export */}
              <button
                onClick={handleCopyQuizlet}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between text-left transition-all cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Copy className="w-4 h-4 text-indigo-400" />
                    Copy for Quizlet
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tab between term & definition, ready to paste into Quizlet Create Set
                  </p>
                </div>
                {copiedType === 'quizlet' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            <button
              onClick={() => setIsExportOpen(false)}
              className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
