import React from 'react';
import { SampleNoteInfo } from '../data/sampleNotes';

interface Props {
  sample: SampleNoteInfo;
  className?: string;
}

export const NoteSheetPreview: React.FC<Props> = ({ sample, className = '' }) => {
  return (
    <div
      className={`relative bg-[#FFFDF5] text-slate-800 rounded-xl p-4 shadow-md border border-amber-200/80 overflow-hidden font-mono text-[11px] leading-relaxed select-none ${className}`}
    >
      {/* Red margin line on left */}
      <div className="absolute top-0 bottom-0 left-8 w-[1.5px] bg-rose-300" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2 pl-6">
        <div>
          <span className="font-bold text-slate-900 text-xs tracking-tight">{sample.name}</span>
          <span className="text-[10px] text-slate-500 block">{sample.subject} • Lecture Notes</span>
        </div>
        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
          PAGE 1/1
        </span>
      </div>

      {/* Ruled notes content with highlighter styling */}
      <div className="space-y-1.5 pl-6">
        <div className="inline-block bg-yellow-200/70 px-1 rounded text-slate-900 font-semibold">
          • Core Focus: High-Yield Testable Principles
        </div>
        <p className="text-slate-700 text-[10px] italic">
          "{sample.transcriptionSnippet}"
        </p>
      </div>

      {/* Diagram summary box */}
      <div className="mt-3 ml-6 p-2 rounded-lg bg-sky-50 border border-sky-200 text-[10px] text-sky-900">
        <span className="font-bold block text-[9px] uppercase tracking-wider text-sky-700 mb-0.5">
          ⚡ Mechanism / Concept Box
        </span>
        <span className="font-mono text-[10px]">{sample.subtitle}</span>
      </div>
    </div>
  );
};
