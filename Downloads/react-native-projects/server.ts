import express, { Request, Response } from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable universal CORS for mobile Expo Go and external apps
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Increase payload limit for base64 camera image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google Gen AI client with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function isValidApiKey(key?: string): boolean {
  return Boolean(
    key &&
    key !== 'MY_GEMINI_API_KEY' &&
    !key.includes('MY_GEMINI') &&
    key.trim().length > 15
  );
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const currentKey = process.env.GEMINI_API_KEY || apiKey;
  res.json({
    status: 'ok',
    hasApiKey: isValidApiKey(currentKey),
    model: 'gemini-3.8-flash',
  });
});

// Direct project file download endpoints for Expo Go
app.get('/App.expo.tsx', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'App.expo.tsx'));
});

app.get('/app.json', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'app.json'));
});

import { generateCardsFromText } from './src/utils/textToDeck.ts';

// Helper to extract text from an image buffer using Tesseract OCR
async function extractTextFromImageBuffer(buffer: Buffer): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    return data.text || '';
  } catch (err) {
    console.warn('[OCR Error]:', err);
    return '';
  } finally {
    try {
      await worker.terminate();
    } catch {}
  }
}

interface GenerateRequest {
  imageBase64?: string;
  mimeType?: string;
  notesText?: string;
  sampleId?: string;
  targetCount?: number;
}

// Pre-packaged high-yield sample decks for instant zero-latency demo / fallback
const SAMPLE_DECKS: Record<string, any> = {
  biology: {
    title: 'Cellular Respiration & Bioenergetics',
    subject: 'AP/College Biology',
    cards: [
      {
        id: 'bio-1',
        front: 'What is the primary net ATP yield per glucose molecule during Glycolysis alone?',
        back: 'Net 2 ATP (4 ATP produced minus 2 ATP consumed during phosphorylation phase), along with 2 NADH and 2 pyruvate molecules.',
        concept: 'Glycolysis',
        evidenceCitation: 'Section 1.1: "Glycolysis yields a net gain of 2 ATP and 2 NADH in the cytoplasm."',
        difficulty: 'easy',
        tag: 'Mechanism',
      },
      {
        id: 'bio-2',
        front: 'Where specifically does the Citric Acid (Krebs) Cycle occur in eukaryotic cells?',
        back: 'In the mitochondrial matrix.',
        concept: 'Mitochondrial Compartments',
        evidenceCitation: 'Section 2: "Pyruvate is transported across both membranes into the inner mitochondrial matrix."',
        difficulty: 'easy',
        tag: 'Anatomy',
      },
      {
        id: 'bio-3',
        front: 'What role does Oxygen (O₂) play at the end of the electron transport chain (ETC)?',
        back: 'Oxygen acts as the terminal electron acceptor, binding 2 electrons and 2 protons (H+) to form water (H₂O).',
        concept: 'Oxidative Phosphorylation',
        evidenceCitation: 'Diagram: "O₂ + 4H⁺ + 4e⁻ -> 2H₂O at Complex IV."',
        difficulty: 'medium',
        tag: 'Core Principle',
      },
      {
        id: 'bio-4',
        front: 'What enzyme drives photophosphorylation/oxidative phosphorylation using the proton-motive force?',
        back: 'ATP Synthase (F₀F₁ complex), which rotates as H⁺ ions flow down their electrochemical gradient.',
        concept: 'Chemiosmosis',
        evidenceCitation: 'Note box: "ATP Synthase rotor turns via proton flux from intermembrane space to matrix."',
        difficulty: 'medium',
        tag: 'Mechanism',
      },
      {
        id: 'bio-5',
        front: 'What molecule enters the Krebs cycle after the pyruvate dehydrogenase reaction?',
        back: 'Acetyl-CoA (a 2-carbon acetyl group coupled to Coenzyme A).',
        concept: 'Link Reaction',
        evidenceCitation: 'Arrow flow: "Pyruvate (3C) -> Decarboxylation -> Acetyl-CoA (2C) + CO₂."',
        difficulty: 'medium',
        tag: 'Pathway',
      },
      {
        id: 'bio-6',
        front: 'How many NADH and FADH₂ are produced per single turn of the Krebs cycle (per 1 Acetyl-CoA)?',
        back: '3 NADH, 1 FADH₂, and 1 GTP (or ATP), plus 2 CO₂ molecules released.',
        concept: 'Krebs Cycle Stoichiometry',
        evidenceCitation: 'Table: "Per acetyl group: 3 NADH, 1 FADH2, 1 ATP."',
        difficulty: 'hard',
        tag: 'Stoichiometry',
      },
      {
        id: 'bio-7',
        front: 'What differentiates anaerobic lactic acid fermentation from aerobic respiration in terms of NAD⁺?',
        back: 'Fermentation regenerates NAD⁺ from NADH without oxygen so glycolysis can continue generating 2 ATP.',
        concept: 'Anaerobic Fermentation',
        evidenceCitation: 'Margin note: "Without O2, fermentation must regenerate NAD+ so GAPDH step does not stall."',
        difficulty: 'medium',
        tag: 'Comparison',
      },
      {
        id: 'bio-8',
        front: 'What is the function of the mitochondrial inner membrane cristae folds?',
        back: 'They dramatically increase surface area for thousands of ETC protein complexes and ATP synthase enzymes.',
        concept: 'Mitochondrial Structure',
        evidenceCitation: 'Textbook text: "Cristae expand available surface area for oxidative phosphorylation complexes."',
        difficulty: 'easy',
        tag: 'Anatomy',
      },
      {
        id: 'bio-9',
        front: 'What is the effect of an uncoupling agent (like DNP or Thermogenin) on mitochondria?',
        back: 'It dissipates the proton gradient across the inner membrane as heat without synthesizing ATP.',
        concept: 'Chemiosmotic Uncoupling',
        evidenceCitation: 'Clinical box: "Uncouplers allow H+ leakage, producing thermal energy instead of ATP."',
        difficulty: 'hard',
        tag: 'Mechanism',
      },
      {
        id: 'bio-10',
        front: 'Which enzyme catalyzes the committed, heavily regulated step of glycolysis?',
        back: 'Phosphofructokinase-1 (PFK-1), allosterically inhibited by ATP and activated by AMP/ADP.',
        concept: 'Metabolic Regulation',
        evidenceCitation: 'Starred note: "PFK-1 is the rate-limiting pacemaker of glycolysis."',
        difficulty: 'hard',
        tag: 'Enzyme Kinetics',
      },
      {
        id: 'bio-11',
        front: 'What is the theoretical maximum net ATP produced per molecule of glucose in aerobic respiration?',
        back: 'Approximately 30 to 32 ATP (older textbooks approximate 36-38 ATP).',
        concept: 'Energetic Yield',
        evidenceCitation: 'Summary table: "Net ATP per glucose ~ 30-32 based on proton-to-ATP ratios."',
        difficulty: 'medium',
        tag: 'Key Fact',
      },
      {
        id: 'bio-12',
        front: 'What is substrate-level phosphorylation versus oxidative phosphorylation?',
        back: 'Substrate-level directly transfers a phosphate from an organic substrate to ADP (as in glycolysis & Krebs); oxidative phosphorylation uses the proton gradient and ATP synthase.',
        concept: 'Phosphorylation Types',
        evidenceCitation: 'Compare box: "Direct phosphate transfer vs ETC chemiosmotic coupling."',
        difficulty: 'medium',
        tag: 'Comparison',
      },
      {
        id: 'bio-13',
        front: 'What happens to pyruvate when oxygen is scarce in human muscle tissue?',
        back: 'Lactate dehydrogenase reduces pyruvate to L-lactate while oxidizing NADH back to NAD⁺.',
        concept: 'Lactic Acid Pathway',
        evidenceCitation: 'Diagram: "Pyruvate + NADH -> Lactate + NAD+."',
        difficulty: 'easy',
        tag: 'Pathway',
      },
      {
        id: 'bio-14',
        front: 'Which complex in the electron transport chain does NOT pump protons across the inner membrane?',
        back: 'Complex II (Succinate dehydrogenase / succinate-CoQ oxidoreductase).',
        concept: 'ETC Complexes',
        evidenceCitation: 'Note: "Complex II transfers electrons from FADH2 without translocating H+."',
        difficulty: 'hard',
        tag: 'Mechanism',
      },
      {
        id: 'bio-15',
        front: 'What is the role of Coenzyme Q (Ubiquinone) in the electron transport chain?',
        back: 'It is a lipid-soluble mobile carrier that shuttles electrons from Complexes I and II to Complex III.',
        concept: 'Mobile Carriers',
        evidenceCitation: 'Diagram: "Ubiquinone (Q) diffuses in the lipid bilayer to Complex III."',
        difficulty: 'medium',
        tag: 'Mechanism',
      },
      {
        id: 'bio-16',
        front: 'What is Cytochrome c and where is it situated?',
        back: 'A small, water-soluble hemeprotein loosely associated with the outer surface of the inner mitochondrial membrane that carries 1 electron to Complex IV.',
        concept: 'Mobile Carriers',
        evidenceCitation: 'Annotation: "Cyt c transfers single electrons from Complex III to Complex IV."',
        difficulty: 'hard',
        tag: 'Anatomy',
      },
      {
        id: 'bio-17',
        front: 'What is beta-oxidation and how does it feed into cellular respiration?',
        back: 'The metabolic breakdown of fatty acids into 2-carbon acetyl-CoA units that directly enter the Krebs cycle.',
        concept: 'Lipid Catabolism',
        evidenceCitation: 'Sub-section: "Fatty acyl-CoA is cleaved 2 carbons at a time into Acetyl-CoA."',
        difficulty: 'medium',
        tag: 'Pathway',
      },
      {
        id: 'bio-18',
        front: 'In which cellular compartment does the breakdown of glucose to pyruvate take place?',
        back: 'The cytosol (cytoplasm) of the cell.',
        concept: 'Cellular Localization',
        evidenceCitation: 'Header: "Stage 1: Cytosolic Glycolysis."',
        difficulty: 'easy',
        tag: 'Anatomy',
      },
      {
        id: 'bio-19',
        front: 'What causes the pH of the mitochondrial intermembrane space to be lower than the matrix?',
        back: 'Complexes I, III, and IV pump H⁺ protons from the matrix into the intermembrane space, creating an acidic reservoir.',
        concept: 'Electrochemical Gradient',
        evidenceCitation: 'Callout: "H+ accumulation in intermembrane space yields pH ~ 7.0 vs matrix pH ~ 7.8."',
        difficulty: 'hard',
        tag: 'Core Principle',
      },
      {
        id: 'bio-20',
        front: 'Why is cyanide (CN⁻) a lethal metabolic poison?',
        back: 'Cyanide irreversibly binds to iron in Complex IV (cytochrome c oxidase), halting the ETC and ATP generation.',
        concept: 'Metabolic Inhibitors',
        evidenceCitation: 'Warning callout: "Cyanide halts Complex IV, causing rapid cellular asphyxiation."',
        difficulty: 'medium',
        tag: 'Clinical / Toxicology',
      },
    ],
  },
  chemistry: {
    title: 'Organic Chemistry: Carbonyls & Nucleophilic Addition',
    subject: 'Organic Chemistry II',
    cards: [
      {
        id: 'chem-1',
        front: 'Why is the carbonyl carbon (C=O) electrophilic?',
        back: 'Because oxygen is significantly more electronegative than carbon, pulling electron density away and creating a partial positive charge (δ+) on carbon.',
        concept: 'Carbonyl Polarity',
        evidenceCitation: 'Top sketch: "Dipole moment shows C(δ+) and O(δ-)."',
        difficulty: 'easy',
        tag: 'Electronic Structure',
      },
      {
        id: 'chem-2',
        front: 'What is the hybridization and geometry of an unreacted carbonyl carbon in an aldehyde or ketone?',
        back: 'sp² hybridized with trigonal planar geometry (~120° bond angles).',
        concept: 'Hybridization',
        evidenceCitation: 'Section 1: "Carbonyl carbon is sp2 with an empty pi* antibonding orbital."',
        difficulty: 'easy',
        tag: 'Geometry',
      },
      {
        id: 'chem-3',
        front: 'What angle does a nucleophile prefer when attacking a carbonyl carbon (Bürgi-Dunitz angle)?',
        back: 'Approximately 107° relative to the C=O double bond, maximizing overlap with the π* antibonding orbital.',
        concept: 'Nucleophilic Attack Trajectory',
        evidenceCitation: 'Margin note: "Bürgi-Dunitz angle ~ 107 degrees."',
        difficulty: 'hard',
        tag: 'Stereoelectronics',
      },
      {
        id: 'chem-4',
        front: 'Why are aldehydes generally more reactive toward nucleophilic addition than ketones?',
        back: 'Sterics: Aldehydes have only one alkyl group (less crowded). Electronics: Ketones have two alkyl groups that donate electron density, stabilizing the partial positive charge.',
        concept: 'Aldehyde vs Ketone Reactivity',
        evidenceCitation: 'Comparison box: "Aldehydes > Ketones due to less steric hindrance and less hyperconjugation."',
        difficulty: 'medium',
        tag: 'Comparison',
      },
      {
        id: 'chem-5',
        front: 'What is a Grignard reagent, and how is it prepared?',
        back: 'An organomagnesium halide (R-MgX) prepared by reacting an alkyl or aryl halide (R-X) with elemental magnesium in dry ether or THF.',
        concept: 'Grignard Reagents',
        evidenceCitation: 'Reaction 3: "R-X + Mg -> R-MgX in dry Et2O."',
        difficulty: 'easy',
        tag: 'Synthesis',
      },
      {
        id: 'chem-6',
        front: 'What product is formed when a Grignard reagent reacts with formaldehyde (HCHO) followed by acid workup?',
        back: 'A primary (1°) alcohol with one additional carbon.',
        concept: 'Grignard Additions',
        evidenceCitation: 'Row 1: "RMgX + HCHO -> 1° alcohol."',
        difficulty: 'medium',
        tag: 'Product Prediction',
      },
      {
        id: 'chem-7',
        front: 'What product is formed when a Grignard reagent reacts with an aldehyde (other than formaldehyde)?',
        back: 'A secondary (2°) alcohol.',
        concept: 'Grignard Additions',
        evidenceCitation: 'Row 2: "RMgX + R\'CHO -> 2° alcohol."',
        difficulty: 'medium',
        tag: 'Product Prediction',
      },
      {
        id: 'chem-8',
        front: 'What product is formed when a Grignard reagent reacts with a ketone?',
        back: 'A tertiary (3°) alcohol.',
        concept: 'Grignard Additions',
        evidenceCitation: 'Row 3: "RMgX + R\'COR\'\' -> 3° alcohol."',
        difficulty: 'easy',
        tag: 'Product Prediction',
      },
      {
        id: 'chem-9',
        front: 'Why must Grignard reactions be conducted in strictly anhydrous (water-free) conditions?',
        back: 'Grignard reagents are powerful bases that are instantly protonated and destroyed by trace water to form alkanes (R-H + HOMgX).',
        concept: 'Grignard Sensitivity',
        evidenceCitation: 'Warning underline: "Water kills Grignards! RMgX + H2O -> RH + Mg(OH)X."',
        difficulty: 'easy',
        tag: 'Lab Technique',
      },
      {
        id: 'chem-10',
        front: 'What functional group consists of two -OR groups attached to the same carbon atom?',
        back: 'An acetal (or ketal).',
        concept: 'Acetals and Ketals',
        evidenceCitation: 'Definition: "Acetal = C bonded to two -OR groups and one -H."',
        difficulty: 'easy',
        tag: 'Definition',
      },
      {
        id: 'chem-11',
        front: 'What intermediate is formed during the acid-catalyzed conversion of a ketone to an acetal?',
        back: 'A hemiacetal (one -OH and one -OR group on the same carbon).',
        concept: 'Acetal Mechanism',
        evidenceCitation: 'Step 2: "Ketone + 1 eq ROH -> Hemiacetal intermediate."',
        difficulty: 'medium',
        tag: 'Mechanism',
      },
      {
        id: 'chem-12',
        front: 'Why can acetals serve as protecting groups for aldehydes and ketones?',
        back: 'Acetals are stable to strong bases, reducing agents (LiAlH₄), and nucleophiles; they can be cleaved back to carbonyls with aqueous acid.',
        concept: 'Protecting Groups',
        evidenceCitation: 'Note: "Use ethylene glycol to protect carbonyls against base/LiAlH4."',
        difficulty: 'medium',
        tag: 'Synthesis Strategy',
      },
      {
        id: 'chem-13',
        front: 'What is the product when a primary amine (R-NH₂) reacts with an aldehyde or ketone under mild acid?',
        back: 'An imine (Schiff base) containing a C=N double bond.',
        concept: 'Imine Formation',
        evidenceCitation: 'Mechanism scheme: "R\'2C=O + RNH2 (pH 4-5) -> R\'2C=NR + H2O."',
        difficulty: 'medium',
        tag: 'Mechanism',
      },
      {
        id: 'chem-14',
        front: 'What is the product when a secondary amine (R₂NH) reacts with a ketone with an alpha-hydrogen?',
        back: 'An enamine (alkene-amine, C=C-NR₂).',
        concept: 'Enamine Formation',
        evidenceCitation: 'Scheme: "Secondary amine cannot lose second proton, eliminates alpha-H to give enamine."',
        difficulty: 'hard',
        tag: 'Mechanism',
      },
      {
        id: 'chem-15',
        front: 'Compare the reducing strength of NaBH₄ versus LiAlH₄ (LAH).',
        back: 'NaBH₄ is mild and reduces only aldehydes and ketones (compatible with alcohols); LiAlH₄ is powerful and reduces esters, carboxylic acids, and amides in addition to carbonyls.',
        concept: 'Hydride Reducing Agents',
        evidenceCitation: 'Table: "NaBH4 reduces aldehydes/ketones; LAH reduces all carbonyl derivatives."',
        difficulty: 'medium',
        tag: 'Comparison',
      },
      {
        id: 'chem-16',
        front: 'What reagent is used in the Wolff-Kishner reduction and what does it accomplish?',
        back: 'Hydrazine (H₂NNH₂) and strong base (KOH/heat) to completely reduce a carbonyl (C=O) to a methylene group (CH₂).',
        concept: 'Wolff-Kishner Reduction',
        evidenceCitation: 'Named reaction note: "Wolff-Kishner: C=O -> CH2 under strongly basic conditions."',
        difficulty: 'hard',
        tag: 'Named Reaction',
      },
      {
        id: 'chem-17',
        front: 'What is the Clemmensen reduction and how does it contrast with Wolff-Kishner?',
        back: 'Clemmensen uses zinc amalgam (Zn[Hg]) and concentrated HCl (strongly acidic), whereas Wolff-Kishner uses strongly basic conditions.',
        concept: 'Clemmensen Reduction',
        evidenceCitation: 'Named reaction box: "Clemmensen: Zn(Hg)/HCl (acidic) vs Wolff-Kishner (basic)."',
        difficulty: 'hard',
        tag: 'Named Reaction',
      },
      {
        id: 'chem-18',
        front: 'What reaction converts a ketone or aldehyde into an alkene using a phosphonium ylide?',
        back: 'The Wittig Reaction.',
        concept: 'Wittig Reaction',
        evidenceCitation: 'Title: "Wittig Reaction with Ph3P=CR2 ylides."',
        difficulty: 'medium',
        tag: 'Named Reaction',
      },
      {
        id: 'chem-19',
        front: 'What four-membered cyclic intermediate is formed during the Wittig reaction?',
        back: 'An oxaphosphetane ring.',
        concept: 'Wittig Intermediate',
        evidenceCitation: 'Mechanism drawing: "4-membered oxaphosphetane intermediate decomposes to alkene + Ph3P=O."',
        difficulty: 'hard',
        tag: 'Mechanism',
      },
      {
        id: 'chem-20',
        front: 'Why is the formation of triphenylphosphine oxide (Ph₃P=O) the thermodynamic driving force of the Wittig reaction?',
        back: 'The phosphorus-oxygen double bond (P=O) is exceptionally strong and thermodynamically stable (~540 kJ/mol).',
        concept: 'Thermodynamics of Wittig',
        evidenceCitation: 'Underline: "Extremely strong P=O bond drives the irreversible reaction."',
        difficulty: 'hard',
        tag: 'Thermodynamics',
      },
    ],
  },
  history: {
    title: 'World War I: Causes & Alliances (1914–1918)',
    subject: 'Modern World History',
    cards: [
      {
        id: 'hist-1',
        front: 'What does the acronym M-A-I-N stand for regarding the underlying causes of World War I?',
        back: 'Militarism, Alliances, Imperialism, and Nationalism.',
        concept: 'M-A-I-N Causes',
        evidenceCitation: 'Header mnemonic: "M - Militarism, A - Alliances, I - Imperialism, N - Nationalism."',
        difficulty: 'easy',
        tag: 'Mnemonic',
      },
      {
        id: 'hist-2',
        front: 'What specific event on June 28, 1914 in Sarajevo triggered the July Crisis?',
        back: 'The assassination of Archduke Franz Ferdinand (heir to the Austro-Hungarian throne) and his wife Sophie by Gavrilo Princip.',
        concept: 'Catalyst Event',
        evidenceCitation: 'Timeline entry: "June 28, 1914: Archduke Franz Ferdinand assassinated in Sarajevo by Gavrilo Princip."',
        difficulty: 'easy',
        tag: 'Key Date',
      },
      {
        id: 'hist-3',
        front: 'Which secret Serbian nationalist organization was Gavrilo Princip a member of?',
        back: 'The Black Hand (Union or Death).',
        concept: 'Balkan Nationalism',
        evidenceCitation: 'Text excerpt: "Princip was armed and directed by the Serbian Black Hand society."',
        difficulty: 'medium',
        tag: 'Organization',
      },
      {
        id: 'hist-4',
        front: 'What was Germany\'s "Blank Check" issued to Austria-Hungary in July 1914?',
        back: 'Kaiser Wilhelm II\'s unconditional promise of German military backing if Austria-Hungary went to war with Serbia.',
        concept: 'Diplomatic Blank Check',
        evidenceCitation: 'Doc quote: "Germany assured Austria of unconditional support against Serbia."',
        difficulty: 'medium',
        tag: 'Diplomacy',
      },
      {
        id: 'hist-5',
        front: 'Which nations comprised the Triple Entente prior to the outbreak of war in 1914?',
        back: 'Great Britain, France, and Russia.',
        concept: 'Alliance Systems',
        evidenceCitation: 'Alliance map: "Triple Entente: Britain, France, Russian Empire."',
        difficulty: 'easy',
        tag: 'Alliance',
      },
      {
        id: 'hist-6',
        front: 'Which nations originally formed the Triple Alliance in 1882?',
        back: 'Germany, Austria-Hungary, and Italy (Italy later joined the Allied Powers in 1915).',
        concept: 'Alliance Systems',
        evidenceCitation: 'Footnote: "Italy remained neutral initially, then joined the Entente in 1915."',
        difficulty: 'medium',
        tag: 'Alliance',
      },
      {
        id: 'hist-7',
        front: 'What was the core objective of the German Schlieffen Plan?',
        back: 'To rapidly knock France out of the war in six weeks through neutral Belgium before turning east to face slower-mobilizing Russia.',
        concept: 'Military Strategy',
        evidenceCitation: 'Diagram: "Schlieffen Plan: swift invasion through Belgium to encircle Paris."',
        difficulty: 'medium',
        tag: 'Strategy',
      },
      {
        id: 'hist-8',
        front: 'What action directly prompted Great Britain to declare war on Germany on August 4, 1914?',
        back: 'Germany\'s violation of Belgian neutrality (guaranteed by the 1839 Treaty of London).',
        concept: 'British Entry',
        evidenceCitation: 'Treaty reference: "Treaty of London 1839 violated when German armies entered Belgium."',
        difficulty: 'medium',
        tag: 'Treaty',
      },
      {
        id: 'hist-9',
        front: 'Why were the Balkans referred to as the "Powder Keg of Europe"?',
        back: 'Overlapping ethnic rivalries, crumbling Ottoman control, and competing territorial ambitions of Russia and Austria-Hungary.',
        concept: 'Balkan Geopolitics',
        evidenceCitation: 'Section header: "The Balkan Powder Keg: pan-Slavism vs Habsburg expansion."',
        difficulty: 'easy',
        tag: 'Geopolitics',
      },
      {
        id: 'hist-10',
        front: 'What naval arms race contributed to escalating tensions between Britain and Germany before 1914?',
        back: 'The Dreadnought battleship race sparked by Admiral von Tirpitz\'s Naval Laws and Britain\'s two-power standard.',
        concept: 'Naval Militarism',
        evidenceCitation: 'Sidebar: "1906 launch of HMS Dreadnought prompted German expansion at Kiel."',
        difficulty: 'hard',
        tag: 'Militarism',
      },
      {
        id: 'hist-11',
        front: 'What 1914 battle halted the German advance toward Paris and initiated static trench warfare on the Western Front?',
        back: 'The First Battle of the Marne (September 1914).',
        concept: 'Turning Points',
        evidenceCitation: 'Battle box: "First Battle of the Marne ends German war of movement; trenches dug from Swiss border to North Sea."',
        difficulty: 'medium',
        tag: 'Key Battle',
      },
      {
        id: 'hist-12',
        front: 'What was Pan-Slavism and how did it link Russia to Serbia?',
        back: 'The nationalist ideology that all Slavic peoples shared a common heritage, positioning Russia as Serbia’s protector against Austrian domination.',
        concept: 'Pan-Slavism',
        evidenceCitation: 'Paragraph 3: "Tsar Nicholas II felt obligated by Pan-Slavic ties to mobilize for Serbia."',
        difficulty: 'medium',
        tag: 'Ideology',
      },
      {
        id: 'hist-13',
        front: 'What diplomatic crises in North Africa (1905 and 1911) tested the Anglo-French Entente?',
        back: 'The First (Tangier) and Second (Agadir) Moroccan Crises, both engineered by Germany.',
        concept: 'Imperial Rivalries',
        evidenceCitation: 'Timeline: "1905 Tangier Crisis & 1911 Agadir Panther incident solidified British-French naval cooperation."',
        difficulty: 'hard',
        tag: 'Imperialism',
      },
      {
        id: 'hist-14',
        front: 'What was the Telegram sent by Germany to Mexico in 1917 proposing an alliance that angered the United States?',
        back: 'The Zimmermann Telegram (promising Mexico the return of Texas, New Mexico, and Arizona).',
        concept: 'US Entry Catalysts',
        evidenceCitation: 'Primary source box: "British cryptographers intercepted German foreign secretary Zimmermann\'s telegram to Mexico."',
        difficulty: 'easy',
        tag: 'Primary Source',
      },
      {
        id: 'hist-15',
        front: 'What German submarine policy resumed in February 1917, directly contributing to US entry into the war?',
        back: 'Unrestricted Submarine Warfare (targeting all merchant vessels in allied waters).',
        concept: 'Naval Warfare',
        evidenceCitation: 'Bullet point: "Feb 1, 1917: Resumption of unrestricted U-boat warfare."',
        difficulty: 'easy',
        tag: 'Key Policy',
      },
      {
        id: 'hist-16',
        front: 'What treaty ended Russia\'s participation in World War I in March 1918 following the Bolshevik Revolution?',
        back: 'The Treaty of Brest-Litovsk, which ceded vast western territories of the Russian Empire to Germany.',
        concept: 'Eastern Front Exit',
        evidenceCitation: 'Sidebar: "Lenin signs Brest-Litovsk, March 1918, surrendering Ukraine and Baltic lands."',
        difficulty: 'medium',
        tag: 'Treaty',
      },
      {
        id: 'hist-17',
        front: 'What was the exact date and time the Armistice took effect on the Western Front?',
        back: 'November 11, 1918 at 11:00 AM ("the 11th hour of the 11th day of the 11th month").',
        concept: 'Armistice',
        evidenceCitation: 'Banner: "Armistice signed in Compiègne wagon on 11/11/1918 at 11:00 AM."',
        difficulty: 'easy',
        tag: 'Key Date',
      },
      {
        id: 'hist-18',
        front: 'What controversial clause (Article 231) in the 1919 Treaty of Versailles placed sole responsibility for the war on Germany?',
        back: 'The "War Guilt" clause (Schuldklausel), mandating massive financial reparations.',
        concept: 'Versailles Settlement',
        evidenceCitation: 'Treaty extract: "Article 231: Germany accepts responsibility of Germany and her allies for causing all loss and damage."',
        difficulty: 'medium',
        tag: 'Treaty Clause',
      },
      {
        id: 'hist-19',
        front: 'What international peacekeeping body was created under Woodrow Wilson\'s Fourteen Points?',
        back: 'The League of Nations (which the US Senate ultimately refused to join).',
        concept: 'Post-War Order',
        evidenceCitation: 'Point 14: "A general association of nations must be formed under specific covenants."',
        difficulty: 'easy',
        tag: 'Organization',
      },
      {
        id: 'hist-20',
        front: 'Which four major imperial empires collapsed as a direct consequence of World War I?',
        back: 'The German Empire (Hohenzollern), Russian Empire (Romanov), Austro-Hungarian Empire (Habsburg), and Ottoman Empire.',
        concept: 'Imperial Collapse',
        evidenceCitation: 'Conclusion chart: "Four fallen dynasties: Romanov, Habsburg, Hohenzollern, Ottoman."',
        difficulty: 'hard',
        tag: 'Historical Impact',
      },
    ],
  },
};

// Route to fetch pre-made samples for instant testing
app.get('/api/sample-decks', (_req: Request, res: Response) => {
  res.json({
    samples: [
      {
        id: 'biology',
        title: SAMPLE_DECKS.biology.title,
        subject: SAMPLE_DECKS.biology.subject,
        count: SAMPLE_DECKS.biology.cards.length,
        description: 'Messy lecture notes & diagrams on Cellular Respiration, Glycolysis & ATP Synthase.',
      },
      {
        id: 'chemistry',
        title: SAMPLE_DECKS.chemistry.title,
        subject: SAMPLE_DECKS.chemistry.subject,
        count: SAMPLE_DECKS.chemistry.cards.length,
        description: 'Organic chemistry reaction mechanisms, Grignard reagents, and acetal protecting groups.',
      },
      {
        id: 'history',
        title: SAMPLE_DECKS.history.title,
        subject: SAMPLE_DECKS.history.subject,
        count: SAMPLE_DECKS.history.cards.length,
        description: 'Textbook page covering the M-A-I-N causes of WWI, the July Crisis, and battle timelines.',
      },
    ],
  });
});

// Main Card Generation Endpoint using Gemini 3.8 Flash + High-Precision Visual OCR Fallback
app.post('/api/generate-cards', async (req: Request, res: Response) => {
  console.log('[API] /api/generate-cards received request. Keys:', Object.keys(req.body));
  try {
    const { imageBase64, mimeType, notesText, sampleId, targetCount = 20 }: GenerateRequest = req.body;
    console.log('[API] imageBase64 length:', imageBase64 ? imageBase64.length : 0, 'sampleId:', sampleId, 'notesText length:', notesText ? notesText.length : 0);

    // Fast-path 1: Explicit sample selection without custom image or text
    if (sampleId && SAMPLE_DECKS[sampleId] && !imageBase64 && !notesText) {
      console.log('[API] Returning pre-curated sample deck for:', sampleId);
      const sample = SAMPLE_DECKS[sampleId];
      return res.json({
        success: true,
        deck: {
          id: `deck-${sampleId}-${Date.now()}`,
          title: sample.title,
          subject: sample.subject,
          createdAt: Date.now(),
          sourceType: 'sample',
          cards: sample.cards.slice(0, targetCount),
        },
      });
    }

    // Direct text input fast-path: if notesText is provided directly
    if (notesText && notesText.trim().length >= 15 && !imageBase64) {
      console.log('[API] Generating flashcards directly from notesText...');
      const currentApiKey = process.env.GEMINI_API_KEY || apiKey;
      if (!isValidApiKey(currentApiKey)) {
        const textDeck = generateCardsFromText(notesText, targetCount, 'upload');
        return res.json({
          success: true,
          deck: textDeck,
          notice: 'Generated directly from your notes using active-recall parsing.',
        });
      }
    }

    // Clean base64 and detect image mime type
    let cleanedBase64 = '';
    let detectedMime = mimeType || 'image/jpeg';
    let imageBuffer: Buffer | null = null;

    if (imageBase64) {
      const match = imageBase64.match(/^data:([a-zA-Z0-9.+_-]+\/[a-zA-Z0-9.+_-]+);base64,(.+)$/s);
      if (match) {
        detectedMime = match[1];
        cleanedBase64 = match[2];
      } else {
        cleanedBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      }
      if (detectedMime === 'image/jpg') detectedMime = 'image/jpeg';
      imageBuffer = Buffer.from(cleanedBase64, 'base64');
      console.log('[API] Processing image with mime:', detectedMime, 'base64 length:', cleanedBase64.length, 'buffer size:', imageBuffer.length);
    }

    // Check Gemini API key
    const currentApiKey = process.env.GEMINI_API_KEY || apiKey;
    const aiClient = isValidApiKey(currentApiKey)
      ? new GoogleGenAI({
          apiKey: currentApiKey!,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        })
      : null;

    let geminiDeck: any = null;

    if (aiClient && (cleanedBase64 || notesText)) {
      try {
        console.log('[API] Sending request to Gemini multimodal models with valid key...');
        const systemInstruction = `You are SnapDeck AI, an elite academic flashcard generation engine for students.
Your mission is to inspect the user's photo of a textbook page, study guide, whiteboard, or handwritten notes, extract all primary and high-yield concepts, and produce exactly ${targetCount} active recall digital flashcards.

CRITICAL ACCURACY & GROUNDING RULES:
1. Every card MUST test a clear, high-impact concept from the image.
2. Front: Formulation of an active recall question or prompt. Keep it punchy and unambiguous.
3. Back: The concise, clear, accurate answer with explanation or key steps.
4. Concept: The overarching subtopic or concept name.
5. Evidence Citation: Quote or cite the exact snippet, equation, section heading, or sentence from the user's notes or textbook image to prove 100% accuracy and ground the card against hallucinations.
6. Tag: Short classification such as "Definition", "Mechanism", "Formula", "Key Fact", "Comparison", "Process", or "Clinical".
7. Difficulty: 'easy', 'medium', or 'hard'.
8. Generate exactly ${targetCount} flashcards. If the page is sparse, infer deeper testable principles and mechanics directly related to the core subject matter shown on the page.`;

        const userPrompt = notesText
          ? `Generate ${targetCount} high-accuracy study flashcards based on this textbook / notes excerpt: "${notesText}"`
          : `Carefully read this photo of student notes / textbook page. Transcribe the handwriting and printed text, extract the core concepts, and generate exactly ${targetCount} flashcards.`;

        const contentsPayload: any = cleanedBase64
          ? {
              parts: [
                {
                  inlineData: {
                    mimeType: detectedMime,
                    data: cleanedBase64,
                  },
                },
                { text: userPrompt },
              ],
            }
          : userPrompt;

        const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
        let responseText: string | undefined = undefined;

        const baseSchema = {
          type: Type.OBJECT,
          properties: {
            deckTitle: {
              type: Type.STRING,
              description: 'A concise, academic title for this flashcard deck based on the note contents',
            },
            subject: {
              type: Type.STRING,
              description: 'The academic subject or field, e.g. Biology, Chemistry, Calculus, History, Economics',
            },
            cards: {
              type: Type.ARRAY,
              description: `List of exactly ${targetCount} flashcards`,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: {
                    type: Type.STRING,
                    description: 'The question or active recall prompt on the front of the card',
                  },
                  back: {
                    type: Type.STRING,
                    description: 'The concise, accurate answer on the back of the card',
                  },
                  concept: {
                    type: Type.STRING,
                    description: 'The primary concept or topic tested',
                  },
                  evidenceCitation: {
                    type: Type.STRING,
                    description: 'Direct quote or contextual excerpt from the notes/page proving factual accuracy',
                  },
                  difficulty: {
                    type: Type.STRING,
                    description: 'Difficulty level: easy, medium, or hard',
                  },
                  tag: {
                    type: Type.STRING,
                    description: 'Category tag, e.g. Definition, Mechanism, Formula, Key Fact, Comparison',
                  },
                },
                required: ['front', 'back', 'concept', 'evidenceCitation', 'difficulty', 'tag'],
              },
            },
          },
          required: ['deckTitle', 'subject', 'cards'],
        };

        for (const modelName of candidateModels) {
          try {
            console.log(`[API] Trying ${modelName}...`);
            const config: any = {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: baseSchema,
            };

            if (modelName === 'gemini-3.8-flash') {
              config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
            }

            const modelPromise = aiClient.models.generateContent({
              model: modelName,
              contents: contentsPayload,
              config,
            });

            // 15 second timeout per model call
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout calling ${modelName}`)), 15000)
            );

            const response: any = await Promise.race([modelPromise, timeoutPromise]);

            if (response && response.text) {
              responseText = response.text;
              console.log(`[API] Success with ${modelName}! Output length:`, responseText?.length || 0);
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[API] ${modelName} error:`, modelErr?.message || modelErr);
          }
        }

        if (responseText) {
          const parsedData = JSON.parse(responseText);
          const cards = (parsedData.cards || []).map((c: any, idx: number) => ({
            id: `card-${Date.now()}-${idx}`,
            front: c.front,
            back: c.back,
            concept: c.concept || parsedData.deckTitle,
            evidenceCitation: c.evidenceCitation || 'Derived from source page notes.',
            difficulty: c.difficulty === 'easy' || c.difficulty === 'hard' ? c.difficulty : 'medium',
            tag: c.tag || 'Key Concept',
            isMastered: false,
          }));

          geminiDeck = {
            id: `deck-${Date.now()}`,
            title: parsedData.deckTitle || 'Extracted Study Deck',
            subject: parsedData.subject || 'General Studies',
            createdAt: Date.now(),
            imageThumbnail: imageBase64 ? imageBase64.slice(0, 500) + '...' : undefined,
            sourceType: imageBase64 ? 'camera' : 'upload',
            cards,
          };
        }
      } catch (geminiErr: any) {
        console.warn('[API] Gemini multimodal attempt failed, transitioning to OCR:', geminiErr?.message || geminiErr);
      }
    }

    if (geminiDeck) {
      return res.json({
        success: true,
        deck: geminiDeck,
      });
    }

    // OCR FALLBACK FOR PHOTOS:
    // If Gemini was not configured or failed, read the photo directly with Tesseract OCR!
    if (imageBuffer) {
      console.log('[API] Extracting text directly from user image using OCR engine...');
      const ocrText = await extractTextFromImageBuffer(imageBuffer);
      console.log('[API] OCR recognized text length:', ocrText.length);

      if (!ocrText || ocrText.trim().replace(/\s+/g, '').length < 15) {
        return res.status(400).json({
          success: false,
          error:
            'Could not detect readable handwriting or printed text from this photo. Please make sure the notes are well lit, in focus, or paste your notes directly.',
        });
      }

      console.log('[API] Generating flashcards from OCR text...');
      const ocrDeck = generateCardsFromText(ocrText, targetCount, 'camera');
      ocrDeck.imageThumbnail = imageBase64 ? imageBase64.slice(0, 500) + '...' : undefined;

      return res.json({
        success: true,
        deck: ocrDeck,
        notice: 'Flashcards created directly from your notes via visual OCR recognition.',
      });
    }

    // If notesText was provided without image
    if (notesText && notesText.trim().length >= 15) {
      const parsedDeck = generateCardsFromText(notesText, targetCount, 'upload');
      return res.json({
        success: true,
        deck: parsedDeck,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Please provide a photo or text of your study notes.',
    });
  } catch (err: any) {
    console.error('[API Error] in /api/generate-cards:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Could not process notes image. Please try again with clear lighting.',
    });
  }
});

// Mount Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SnapDeck AI server running on port ${PORT}`);
  });
}

startServer();
