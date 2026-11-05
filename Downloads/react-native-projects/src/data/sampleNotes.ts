/**
 * High-fidelity simulated student notebook pages and textbook scans
 * Encoded as data URIs with realistic handwriting, diagrams, and highlighter marks.
 */

export interface SampleNoteInfo {
  id: string;
  name: string;
  subject: string;
  subtitle: string;
  badge: string;
  icon: string;
  cardCount: number;
  previewUrl: string;
  transcriptionSnippet: string;
}

// Generate realistic SVG note representations
function createNoteSvgDataUri(
  title: string,
  subject: string,
  notes: string[],
  diagramText: string,
  paperColor = '#FFFDF5',
  inkColor = '#1E293B',
  highlightColor = 'rgba(250, 204, 21, 0.4)'
): string {
  const noteLines = notes
    .map(
      (n, i) =>
        `<text x="40" y="${140 + i * 36}" font-family="system-ui, -apple-system, 'Caveat', cursive, sans-serif" font-size="18" fill="${inkColor}" letter-spacing="0.3">${n}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="${paperColor}"/>
    <!-- Lined notebook paper rules -->
    <line x1="0" y1="90" x2="600" y2="90" stroke="#E2E8F0" stroke-width="1.5"/>
    <line x1="80" y1="0" x2="80" y2="800" stroke="#FCA5A5" stroke-width="1.5"/>
    ${Array.from({ length: 18 })
      .map((_, i) => `<line x1="0" y1="${130 + i * 36}" x2="600" y2="${130 + i * 36}" stroke="#E2E8F0" stroke-width="1"/>`)
      .join('')}
    
    <!-- Highlighter marks -->
    <rect x="35" y="125" width="280" height="22" fill="${highlightColor}" rx="4"/>
    <rect x="35" y="268" width="340" height="22" fill="${highlightColor}" rx="4"/>

    <!-- Subject & Date -->
    <text x="40" y="55" font-family="system-ui, sans-serif" font-weight="bold" font-size="22" fill="#0F172A">${title}</text>
    <text x="40" y="80" font-family="system-ui, sans-serif" font-size="13" fill="#64748B">${subject} • Lecture Unit 4 Notes</text>
    <text x="460" y="55" font-family="monospace" font-size="12" fill="#94A3B8">PAGE 1/2</text>

    <!-- Notes Content -->
    ${noteLines}

    <!-- Diagram Box -->
    <rect x="40" y="480" width="520" height="260" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="60" y="515" font-family="system-ui, sans-serif" font-weight="600" font-size="15" fill="#334155">⚡ DIAGRAM / MECHANISM SUMMARY</text>
    <text x="60" y="550" font-family="monospace" font-size="14" fill="#0F172A">${diagramText}</text>
    <rect x="70" y="590" width="180" height="80" rx="8" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2"/>
    <text x="90" y="635" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#0369A1">Reactants (Gluc)</text>
    <path d="M 250 630 L 320 630" stroke="#0284C7" stroke-width="3" marker-end="url(#arrow)"/>
    <rect x="330" y="590" width="190" height="80" rx="8" fill="#DCFCE7" stroke="#22C55E" stroke-width="2"/>
    <text x="350" y="635" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#15803D">Products + 20 Cards</text>
  </svg>`;

  try {
    const base64 = typeof window !== 'undefined'
      ? window.btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}

export const SAMPLE_NOTES: SampleNoteInfo[] = [
  {
    id: 'biology',
    name: 'Cellular Respiration Notes',
    subject: 'Biology 101',
    subtitle: 'Messy lecture notes on Glycolysis, Krebs & ATP Synthase',
    badge: '20 Flashcards',
    icon: '🧬',
    cardCount: 20,
    previewUrl: createNoteSvgDataUri(
      'Cellular Respiration & ATP Synthesis',
      'AP Biology',
      [
        '• Glycolysis: In cytosol. Gluc (6C) -> 2 Pyruvate (3C). Net: 2 ATP + 2 NADH.',
        '• Link reaction: Pyruvate -> Acetyl-CoA + CO2 (Mito Matrix).',
        '• Krebs / Citric Acid Cycle: In matrix. Yields 3 NADH, 1 FADH2, 1 ATP per turn.',
        '• ETC: Complexes I, II, III, IV in inner membrane. H+ pumped to intermembrane space.',
        '• O2 is final e- acceptor: O2 + 4H+ + 4e- -> 2H2O.',
        '• ATP Synthase: Rotary motor powered by proton-motive force (chemiosmosis).',
        '• Total theoretical yield: ~30-32 ATP per glucose molecule.',
        '• Fermentation: Regenerates NAD+ when O2 absent (lactic acid vs ethanol).',
      ],
      'H+ [Intermembrane (acidic)]  ->  [ATP Synthase Rotor]  ->  ATP generated in Matrix'
    ),
    transcriptionSnippet:
      'Glycolysis occurs in cytosol. Yields net 2 ATP, 2 NADH, 2 Pyruvate. Acetyl-CoA enters Krebs in matrix. Terminal electron acceptor is O2 producing H2O. ATP Synthase driven by proton-motive force across inner cristae membrane.',
  },
  {
    id: 'chemistry',
    name: 'Organic Chem Reactions',
    subject: 'Organic Chemistry II',
    subtitle: 'Handwritten mechanisms for Grignards, Acetals & Carbonyls',
    badge: '20 Flashcards',
    icon: '🧪',
    cardCount: 20,
    previewUrl: createNoteSvgDataUri(
      'Carbonyls & Nucleophilic Additions',
      'Organic Chemistry II',
      [
        '• C=O dipole: Carbon is electrophilic (delta+), Oxygen nucleophilic/basic.',
        '• Aldehydes > Ketones reactivity due to sterics + electronic hyperconjugation.',
        '• Grignard RMgX: Anhydrous ether! Attacks C=O -> Alkoxide intermediate.',
        '  - RMgX + HCHO -> 1 deg alcohol',
        '  - RMgX + RCHO -> 2 deg alcohol',
        '  - RMgX + R2CO -> 3 deg alcohol',
        '• Acetals: 2 eq ROH + acid cat. (dry HCl or TsOH) -> Protecting group.',
        '• Wittig: Ph3P=CR2 ylide + ketone -> Alkene + Ph3P=O (driving force).',
      ],
      'Nucleophile Nu:- attacks sp2 Carbon at Burgi-Dunitz angle (107 deg)'
    ),
    transcriptionSnippet:
      'Carbonyl carbon sp2 electrophilic. Aldehydes more reactive than ketones. Grignard reagents RMgX synthesized in dry ether. Water destroys Grignards. Acetals protect aldehydes/ketones against bases and hydrides.',
  },
  {
    id: 'history',
    name: 'WWI Causes & Treaties',
    subject: 'Modern World History',
    subtitle: 'Textbook page highlighting M-A-I-N causes & July Crisis',
    badge: '20 Flashcards',
    icon: '📜',
    cardCount: 20,
    previewUrl: createNoteSvgDataUri(
      'Causes of the First World War (1914)',
      'Modern World History',
      [
        '• M-A-I-N Causes: Militarism, Alliances, Imperialism, Nationalism.',
        '• June 28, 1914: Archduke Franz Ferdinand assassinated in Sarajevo.',
        '• Gavrilo Princip: Serbian Black Hand secret organization.',
        '• Germany gives Austria-Hungary the "Blank Check" unconditional support.',
        '• Triple Entente: Britain, France, Russia vs Triple Alliance: Ger, Austria-Hungary, Italy.',
        '• Schlieffen Plan: German march through neutral Belgium -> British entry.',
        '• First Battle of the Marne (Sept 1914) halts advance -> static trench warfare.',
        '• Zimmerman Telegram & Unrestricted Sub warfare provoke US entry 1917.',
      ],
      'Crisis Escalation: Sarajevo -> July Ultimatum -> Mobilization -> Western Front Stalemate'
    ),
    transcriptionSnippet:
      'M-A-I-N causes of WWI. Assassination of Archduke Franz Ferdinand on June 28 1914 by Gavrilo Princip (Black Hand). Triple Entente vs Central Powers. Treaty of London 1839 Belgium neutrality violated by Schlieffen Plan.',
  },
];
