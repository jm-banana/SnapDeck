import React, { useState, useEffect } from 'react';
import { Camera, BookOpen, ShieldCheck, Library, Code2, Sparkles } from 'lucide-react';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';
import { CameraViewfinder } from './components/CameraViewfinder';
import { FlashcardViewer } from './components/FlashcardViewer';
import { AccuracyInspector } from './components/AccuracyInspector';
import { DecksLibrary } from './components/DecksLibrary';
import { ReactNativeCodeModal } from './components/ReactNativeCodeModal';
import { ExpoGoModal } from './components/ExpoGoModal';
import { SAMPLE_NOTES, SampleNoteInfo } from './data/sampleNotes';
import { FlashcardDeck, Flashcard } from './utils/deckUtils';
import { sound } from './utils/audio';

type ActiveTab = 'camera' | 'study' | 'accuracy' | 'library';

const STORAGE_KEY = 'snapdeck_ai_decks_v1';

// Initial default deck for instant preview
const INITIAL_DECK: FlashcardDeck = {
  id: 'deck-initial-bio',
  title: 'Cellular Respiration & Bioenergetics',
  subject: 'AP Biology',
  createdAt: Date.now() - 3600000,
  sourceType: 'sample',
  cards: [
    {
      id: 'bio-1',
      front: 'What is the primary net ATP yield per glucose molecule during Glycolysis alone?',
      back: 'Net 2 ATP (4 produced minus 2 consumed in investment phase), along with 2 NADH and 2 pyruvate.',
      concept: 'Glycolysis',
      evidenceCitation: 'Section 1.1: "Glycolysis yields a net gain of 2 ATP and 2 NADH in the cytoplasm."',
      difficulty: 'easy',
      tag: 'Mechanism',
      isMastered: true,
    },
    {
      id: 'bio-2',
      front: 'Where specifically does the Citric Acid (Krebs) Cycle occur in eukaryotic cells?',
      back: 'In the mitochondrial matrix.',
      concept: 'Mitochondrial Compartments',
      evidenceCitation: 'Section 2: "Pyruvate is transported across both membranes into the inner mitochondrial matrix."',
      difficulty: 'easy',
      tag: 'Anatomy',
      isMastered: true,
    },
    {
      id: 'bio-3',
      front: 'What role does Oxygen (O₂) play at the end of the electron transport chain (ETC)?',
      back: 'Oxygen acts as the terminal electron acceptor, binding 2 electrons and 2 protons (H+) to form water (H₂O).',
      concept: 'Oxidative Phosphorylation',
      evidenceCitation: 'Diagram: "O₂ + 4H⁺ + 4e⁻ -> 2H₂O at Complex IV."',
      difficulty: 'medium',
      tag: 'Core Principle',
      isMastered: false,
    },
    {
      id: 'bio-4',
      front: 'What enzyme drives photophosphorylation/oxidative phosphorylation using the proton-motive force?',
      back: 'ATP Synthase (F₀F₁ complex), which rotates as H⁺ ions flow down their electrochemical gradient.',
      concept: 'Chemiosmosis',
      evidenceCitation: 'Note box: "ATP Synthase rotor turns via proton flux from intermembrane space to matrix."',
      difficulty: 'medium',
      tag: 'Mechanism',
      isMastered: false,
    },
    {
      id: 'bio-5',
      front: 'What molecule enters the Krebs cycle after the pyruvate dehydrogenase reaction?',
      back: 'Acetyl-CoA (a 2-carbon acetyl group coupled to Coenzyme A).',
      concept: 'Link Reaction',
      evidenceCitation: 'Arrow flow: "Pyruvate (3C) -> Decarboxylation -> Acetyl-CoA (2C) + CO₂."',
      difficulty: 'medium',
      tag: 'Pathway',
      isMastered: false,
    },
    {
      id: 'bio-6',
      front: 'How many NADH and FADH₂ are produced per single turn of the Krebs cycle (per 1 Acetyl-CoA)?',
      back: '3 NADH, 1 FADH₂, and 1 GTP (or ATP), plus 2 CO₂ molecules released.',
      concept: 'Krebs Cycle Stoichiometry',
      evidenceCitation: 'Table: "Per acetyl group: 3 NADH, 1 FADH2, 1 ATP."',
      difficulty: 'hard',
      tag: 'Stoichiometry',
      isMastered: false,
    },
    {
      id: 'bio-7',
      front: 'What differentiates anaerobic lactic acid fermentation from aerobic respiration in terms of NAD⁺?',
      back: 'Fermentation regenerates NAD⁺ from NADH without oxygen so glycolysis can continue generating 2 ATP.',
      concept: 'Anaerobic Fermentation',
      evidenceCitation: 'Margin note: "Without O2, fermentation must regenerate NAD+ so GAPDH step does not stall."',
      difficulty: 'medium',
      tag: 'Comparison',
      isMastered: false,
    },
    {
      id: 'bio-8',
      front: 'What is the function of the mitochondrial inner membrane cristae folds?',
      back: 'They dramatically increase surface area for thousands of ETC protein complexes and ATP synthase enzymes.',
      concept: 'Mitochondrial Structure',
      evidenceCitation: 'Textbook text: "Cristae expand available surface area for oxidative phosphorylation complexes."',
      difficulty: 'easy',
      tag: 'Anatomy',
      isMastered: false,
    },
    {
      id: 'bio-9',
      front: 'What is the effect of an uncoupling agent (like DNP or Thermogenin) on mitochondria?',
      back: 'It dissipates the proton gradient across the inner membrane as heat without synthesizing ATP.',
      concept: 'Chemiosmotic Uncoupling',
      evidenceCitation: 'Clinical box: "Uncouplers allow H+ leakage, producing thermal energy instead of ATP."',
      difficulty: 'hard',
      tag: 'Mechanism',
      isMastered: false,
    },
    {
      id: 'bio-10',
      front: 'Which enzyme catalyzes the committed, heavily regulated step of glycolysis?',
      back: 'Phosphofructokinase-1 (PFK-1), allosterically inhibited by ATP and activated by AMP/ADP.',
      concept: 'Metabolic Regulation',
      evidenceCitation: 'Starred note: "PFK-1 is the rate-limiting pacemaker of glycolysis."',
      difficulty: 'hard',
      tag: 'Enzyme Kinetics',
      isMastered: false,
    },
    {
      id: 'bio-11',
      front: 'What is the theoretical maximum net ATP produced per molecule of glucose in aerobic respiration?',
      back: 'Approximately 30 to 32 ATP (older textbooks approximate 36-38 ATP).',
      concept: 'Energetic Yield',
      evidenceCitation: 'Summary table: "Net ATP per glucose ~ 30-32 based on proton-to-ATP ratios."',
      difficulty: 'medium',
      tag: 'Key Fact',
      isMastered: false,
    },
    {
      id: 'bio-12',
      front: 'What is substrate-level phosphorylation versus oxidative phosphorylation?',
      back: 'Substrate-level directly transfers a phosphate from an organic substrate to ADP; oxidative phosphorylation uses the proton gradient and ATP synthase.',
      concept: 'Phosphorylation Types',
      evidenceCitation: 'Compare box: "Direct phosphate transfer vs ETC chemiosmotic coupling."',
      difficulty: 'medium',
      tag: 'Comparison',
      isMastered: false,
    },
    {
      id: 'bio-13',
      front: 'What happens to pyruvate when oxygen is scarce in human muscle tissue?',
      back: 'Lactate dehydrogenase reduces pyruvate to L-lactate while oxidizing NADH back to NAD⁺.',
      concept: 'Lactic Acid Pathway',
      evidenceCitation: 'Diagram: "Pyruvate + NADH -> Lactate + NAD+."',
      difficulty: 'easy',
      tag: 'Pathway',
      isMastered: false,
    },
    {
      id: 'bio-14',
      front: 'Which complex in the electron transport chain does NOT pump protons across the inner membrane?',
      back: 'Complex II (Succinate dehydrogenase / succinate-CoQ oxidoreductase).',
      concept: 'ETC Complexes',
      evidenceCitation: 'Note: "Complex II transfers electrons from FADH2 without translocating H+."',
      difficulty: 'hard',
      tag: 'Mechanism',
      isMastered: false,
    },
    {
      id: 'bio-15',
      front: 'What is the role of Coenzyme Q (Ubiquinone) in the electron transport chain?',
      back: 'It is a lipid-soluble mobile carrier that shuttles electrons from Complexes I and II to Complex III.',
      concept: 'Mobile Carriers',
      evidenceCitation: 'Diagram: "Ubiquinone (Q) diffuses in the lipid bilayer to Complex III."',
      difficulty: 'medium',
      tag: 'Mechanism',
      isMastered: false,
    },
    {
      id: 'bio-16',
      front: 'What is Cytochrome c and where is it situated?',
      back: 'A small, water-soluble hemeprotein loosely associated with the outer surface of the inner mitochondrial membrane that carries 1 electron to Complex IV.',
      concept: 'Mobile Carriers',
      evidenceCitation: 'Annotation: "Cyt c transfers single electrons from Complex III to Complex IV."',
      difficulty: 'hard',
      tag: 'Anatomy',
      isMastered: false,
    },
    {
      id: 'bio-17',
      front: 'What is beta-oxidation and how does it feed into cellular respiration?',
      back: 'The metabolic breakdown of fatty acids into 2-carbon acetyl-CoA units that directly enter the Krebs cycle.',
      concept: 'Lipid Catabolism',
      evidenceCitation: 'Sub-section: "Fatty acyl-CoA is cleaved 2 carbons at a time into Acetyl-CoA."',
      difficulty: 'medium',
      tag: 'Pathway',
      isMastered: false,
    },
    {
      id: 'bio-18',
      front: 'In which cellular compartment does the breakdown of glucose to pyruvate take place?',
      back: 'The cytosol (cytoplasm) of the cell.',
      concept: 'Cellular Localization',
      evidenceCitation: 'Header: "Stage 1: Cytosolic Glycolysis."',
      difficulty: 'easy',
      tag: 'Anatomy',
      isMastered: false,
    },
    {
      id: 'bio-19',
      front: 'What causes the pH of the mitochondrial intermembrane space to be lower than the matrix?',
      back: 'Complexes I, III, and IV pump H⁺ protons from the matrix into the intermembrane space, creating an acidic reservoir.',
      concept: 'Electrochemical Gradient',
      evidenceCitation: 'Callout: "H+ accumulation in intermembrane space yields pH ~ 7.0 vs matrix pH ~ 7.8."',
      difficulty: 'hard',
      tag: 'Core Principle',
      isMastered: false,
    },
    {
      id: 'bio-20',
      front: 'Why is cyanide (CN⁻) a lethal metabolic poison?',
      back: 'Cyanide irreversibly binds to iron in Complex IV (cytochrome c oxidase), halting the ETC and ATP generation.',
      concept: 'Metabolic Inhibitors',
      evidenceCitation: 'Warning callout: "Cyanide halts Complex IV, causing rapid cellular asphyxiation."',
      difficulty: 'medium',
      tag: 'Clinical / Toxicology',
      isMastered: false,
    },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('camera');
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage fallback
    }
    return [INITIAL_DECK];
  });

  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || INITIAL_DECK.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('Analyzing notes...');
  const [currentSamplePreview, setCurrentSamplePreview] = useState<string | undefined>(
    SAMPLE_NOTES[0].previewUrl
  );
  const [isRnCodeModalOpen, setIsRnCodeModalOpen] = useState(false);
  const [isExpoModalOpen, setIsExpoModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync decks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch {
      // Storage quota or iframe fallback
    }
  }, [decks]);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0] || INITIAL_DECK;

  // Handle camera capture or sample note selection
  const handleCapture = async ({
    base64,
    sampleId,
    sampleNote,
    notesText,
  }: {
    base64?: string;
    sampleId?: string;
    sampleNote?: SampleNoteInfo;
    notesText?: string;
  }) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setActiveTab('camera');
    setProcessingStep(notesText ? 'Parsing notes text...' : 'Transcribing handwritten notes...');

    if (sampleNote) {
      setCurrentSamplePreview(sampleNote.previewUrl);
    } else if (base64) {
      setCurrentSamplePreview(base64);
    }

    try {
      // Step simulation for realistic feedback
      setTimeout(() => setProcessingStep('Extracting core testable concepts...'), 500);
      setTimeout(() => setProcessingStep('Formulating 20 active-recall flashcards...'), 1100);
      setTimeout(() => setProcessingStep('Verifying factual citations to avoid hallucination...'), 1700);

      const response = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          sampleId,
          notesText,
          targetCount: 20,
        }),
      });

      const data = await response.json();

      if (data.success && data.deck) {
        const newDeck: FlashcardDeck = {
          ...data.deck,
          id: data.deck.id || `deck-${Date.now()}`,
        };

        setDecks((prev) => [newDeck, ...prev]);
        setActiveDeckId(newDeck.id);
        sound.playChime();
        setActiveTab('study');
      } else {
        throw new Error(data.error || 'Failed to extract flashcards from this image.');
      }
    } catch (err: any) {
      console.error('Error generating flashcards:', err);
      const msg = err?.message || 'Could not extract notes from this photo. Please make sure the photo is in focus with good lighting.';
      setErrorMessage(msg);
      // Stay on camera screen so the user can retake or pick another photo
      setActiveTab('camera');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDeck = (updatedDeck: FlashcardDeck) => {
    setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => {
      const remaining = prev.filter((d) => d.id !== deckId);
      if (activeDeckId === deckId && remaining.length > 0) {
        setActiveDeckId(remaining[0].id);
      }
      return remaining;
    });
  };

  return (
    <MobileDeviceFrame
      activeTabTitle={activeDeck?.title}
      isCapturing={isProcessing}
      deckCount={decks.length}
      onOpenReactNativeCode={() => setIsRnCodeModalOpen(true)}
      onOpenExpoGo={() => setIsExpoModalOpen(true)}
    >
      {/* Tab Screen Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {errorMessage && (
          <div className="absolute top-2 left-2 right-2 z-40 p-3 bg-rose-950/90 border border-rose-600/80 rounded-xl text-rose-200 text-xs shadow-xl flex items-start justify-between gap-2 backdrop-blur-md animate-in fade-in">
            <div className="flex-1">
              <span className="font-bold block text-rose-100 mb-0.5">Note Extraction Notice:</span>
              <p className="text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white p-1 rounded font-bold cursor-pointer"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === 'camera' && (
          <CameraViewfinder
            onCapture={handleCapture}
            isProcessing={isProcessing}
            processingStep={processingStep}
          />
        )}

        {activeTab === 'study' && (
          <FlashcardViewer
            deck={activeDeck}
            onUpdateDeck={handleUpdateDeck}
            onRetake={() => setActiveTab('camera')}
            onInspectAccuracy={() => setActiveTab('accuracy')}
          />
        )}

        {activeTab === 'accuracy' && (
          <AccuracyInspector
            deck={activeDeck}
            samplePreviewUrl={currentSamplePreview}
            onBackToStudy={() => setActiveTab('study')}
          />
        )}

        {activeTab === 'library' && (
          <DecksLibrary
            decks={decks}
            activeDeckId={activeDeckId}
            onSelectDeck={(deck) => {
              setActiveDeckId(deck.id);
              setActiveTab('study');
            }}
            onDeleteDeck={handleDeleteDeck}
            onNewSnap={() => setActiveTab('camera')}
          />
        )}
      </main>

      {/* React Native Bottom Tab Navigation Bar */}
      <nav
        aria-label="App Navigation"
        className="h-16 bg-slate-950/95 border-t border-slate-800/80 px-4 flex items-center justify-around z-20 backdrop-blur-md"
      >
        {/* Camera Tab */}
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'camera' ? 'text-sky-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Camera"
        >
          <div className="relative">
            <Camera className="w-5 h-5" />
            {isProcessing && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1">Camera</span>
        </button>

        {/* Study Tab */}
        <button
          onClick={() => setActiveTab('study')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'study' ? 'text-sky-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Cards"
        >
          <div className="relative">
            <BookOpen className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 px-1 text-[8px] font-bold bg-sky-500 text-white rounded-full">
              {activeDeck?.cards.length || 20}
            </span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Cards</span>
        </button>

        {/* Accuracy Tab */}
        <button
          onClick={() => setActiveTab('accuracy')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'accuracy' ? 'text-sky-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Accuracy"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-semibold mt-1">Accuracy</span>
        </button>

        {/* Library Tab */}
        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'library' ? 'text-sky-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Decks"
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Decks</span>
        </button>
      </nav>

      {/* React Native Expo Code Modal */}
      <ReactNativeCodeModal
        isOpen={isRnCodeModalOpen}
        onClose={() => setIsRnCodeModalOpen(false)}
      />

      {/* Expo Go QR Code & Instructions Modal */}
      <ExpoGoModal
        isOpen={isExpoModalOpen}
        onClose={() => setIsExpoModalOpen(false)}
      />
    </MobileDeviceFrame>
  );
}
