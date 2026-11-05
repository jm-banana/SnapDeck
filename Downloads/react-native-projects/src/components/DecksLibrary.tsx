import React, { useState } from 'react';
import { BookOpen, Camera, Trash2, Share2, Download, Copy, Check, ChevronRight } from 'lucide-react';
import { FlashcardDeck, exportToAnkiTSV, exportToQuizletText, calculateMasteryStats } from '../utils/deckUtils';

interface Props {
  decks: FlashcardDeck[];
  activeDeckId?: string;
  onSelectDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (deckId: string) => void;
  onNewSnap: () => void;
}

export const DecksLibrary: React.FC<Props> = ({
  decks,
  activeDeckId,
  onSelectDeck,
  onDeleteDeck,
  onNewSnap,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleExportAnki = (deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    const tsv = exportToAnkiTSV(deck);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.replace(/\s+/g, '_')}_Anki.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedId(`anki-${deck.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyQuizlet = (deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = exportToQuizletText(deck);
    navigator.clipboard.writeText(text);
    setCopiedId(`quizlet-${deck.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 bg-slate-950 text-white flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
        <div>
          <h2 className="font-bold text-white text-sm">Study Decks Library</h2>
          <p className="text-[10px] text-slate-400">
            {decks.length} {decks.length === 1 ? 'Deck' : 'Decks'} Created
          </p>
        </div>

        <button
          onClick={onNewSnap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Snap New</span>
        </button>
      </div>

      {/* Decks List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {decks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
            <p className="font-semibold text-white text-sm mb-1">No Decks Yet</p>
            <p className="text-xs mb-4">
              Point your camera at a textbook page or messy study notes to generate your first 20 cards!
            </p>
            <button
              onClick={onNewSnap}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Open AI Camera
            </button>
          </div>
        ) : (
          decks.map((deck) => {
            const stats = calculateMasteryStats(deck.cards);
            const isActive = deck.id === activeDeckId;

            return (
              <div
                key={deck.id}
                onClick={() => onSelectDeck(deck)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                  isActive
                    ? 'bg-slate-900 border-sky-500/80 shadow-lg shadow-sky-950/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm truncate">{deck.title}</h4>
                      {isActive && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{deck.subject}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleExportAnki(deck, e)}
                      className="p-1 text-slate-400 hover:text-sky-300 rounded"
                      title="Download Anki deck"
                      aria-label="Download Anki deck"
                    >
                      {copiedId === `anki-${deck.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleCopyQuizlet(deck, e)}
                      className="p-1 text-slate-400 hover:text-indigo-300 rounded"
                      title="Copy for Quizlet"
                      aria-label="Copy for Quizlet"
                    >
                      {copiedId === `quizlet-${deck.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {decks.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDeck(deck.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded"
                        title="Delete deck"
                        aria-label="Delete deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar & metrics */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{deck.cards.length} Flashcards</span>
                    <span>{stats.mastered} Mastered ({stats.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
