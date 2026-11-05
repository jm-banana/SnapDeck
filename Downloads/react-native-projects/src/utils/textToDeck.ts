import { Flashcard, FlashcardDeck } from './deckUtils';

interface ParsedConcept {
  term: string;
  definition: string;
  rawSentence: string;
  category: string;
}

/**
 * Clean OCR output lines by removing noise, merging split sentences
 */
export function cleanOcrText(rawText: string): string[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[^a-zA-Z0-9]+$/.test(l));

  const mergedLines: string[] = [];
  let currentBuffer = '';

  for (const line of lines) {
    if (!currentBuffer) {
      currentBuffer = line;
    } else {
      // If line starts with lower case or doesn't end with sentence terminal, merge
      if (/^[a-z0-9,;]/.test(line) && !/[.!?:]$/.test(currentBuffer)) {
        currentBuffer += ' ' + line;
      } else {
        mergedLines.push(currentBuffer);
        currentBuffer = line;
      }
    }
  }

  if (currentBuffer) {
    mergedLines.push(currentBuffer);
  }

  return mergedLines;
}

/**
 * Infer subject and title from header lines or top terms
 */
export function inferDeckMetadata(lines: string[]): { title: string; subject: string } {
  if (lines.length === 0) {
    return { title: 'Extracted Study Deck', subject: 'General Studies' };
  }

  const firstFew = lines.slice(0, 3);
  let titleCandidate = '';

  for (const line of firstFew) {
    // If line looks like a title (short, contains Chapter / Notes / Unit / Lecture, or capitalized)
    if (
      line.length < 60 &&
      (/(chapter|unit|lecture|notes|part|overview|introduction|theory|study guide)/i.test(line) ||
        !/[.?!]$/.test(line))
    ) {
      titleCandidate = line.replace(/^[#\-*•0-9.)\s]+/, '').trim();
      break;
    }
  }

  if (!titleCandidate && lines[0]) {
    titleCandidate = lines[0].slice(0, 50).replace(/^[#\-*•0-9.)\s]+/, '').trim();
  }

  // Infer subject category using word boundaries
  const joined = lines.join(' ').toLowerCase();
  let subject = 'General Studies';

  if (/\b(economics|microeconomics|macroeconomics|econ|gdp|inflation|supply|demand|market|fiscal|monetary|elasticity|monopoly|cost|deadweight)\b/i.test(joined)) {
    subject = 'Economics';
  } else if (/\b(biology|biol|bio|cellular|cells?|dna|rna|atp|protein|organism|enzyme|mitochondria|photosynthesis|genes?|glycolysis|krebs)\b/i.test(joined)) {
    subject = 'Biology';
  } else if (/\b(chemistry|chem|molecules?|reactions?|acids?|bases?|molar|carbonyl|synthesis|electrons?|orbitals?|bonds?)\b/i.test(joined)) {
    subject = 'Chemistry';
  } else if (/\b(derivatives?|integrals?|matrix|vectors?|limits?|equations?|theorems?|calculus|algebra|polynomial)\b/i.test(joined)) {
    subject = 'Mathematics';
  } else if (/\b(velocity|forces?|newton|momentum|energy|gravity|quantum|thermodynamics|circuits?|friction)\b/i.test(joined)) {
    subject = 'Physics';
  } else if (/\b(history|wars?|treaty|empires?|revolutions?|president|crisis|alliances?|century|centuries|constitution)\b/i.test(joined)) {
    subject = 'History';
  } else if (/\b(algorithms?|databases?|functions?|loops?|compilers?|memory|binary|networks?|objects?|classes)\b/i.test(joined)) {
    subject = 'Computer Science';
  } else if (/\b(psychology|cortex|neurons?|behavior|cognitions?|disorders?|memory|conditioning)\b/i.test(joined)) {
    subject = 'Psychology';
  }

  return {
    title: titleCandidate || `${subject} Notes`,
    subject,
  };
}

/**
 * Extract structured terms and statements from cleaned lines
 */
export function extractConceptsFromLines(lines: string[]): ParsedConcept[] {
  const concepts: ParsedConcept[] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/^[#\-*•0-9.)\s]+/, '').trim();
    if (cleanLine.length < 10) continue;

    // Pattern 1: Term : Definition or Term - Definition or Term = Definition
    const delimMatch = cleanLine.match(/^([^:\-=\t]{2,35})[:\-=]\s*(.+)$/);
    if (delimMatch && delimMatch[2].length >= 5) {
      const candidateTerm = delimMatch[1].trim();
      // Skip chapter/unit labels like "Chapter 3: Thermodynamics"
      if (/^(chapter|unit|lecture|section|part|page|title|module)\s+[0-9ivx]+/i.test(candidateTerm)) {
        continue;
      }
      concepts.push({
        term: candidateTerm,
        definition: delimMatch[2].trim(),
        rawSentence: cleanLine,
        category: 'Definition',
      });
      continue;
    }

    // Pattern 2: "X is defined as Y" or "X refers to Y" or "X is the process of Y" or "X means Y"
    const isDefinedMatch = cleanLine.match(
      /^(.{2,35}?)\s+(is defined as|refers to|is the process of|is when|means|describes)\s+(.+)$/i
    );
    if (isDefinedMatch && isDefinedMatch[3].length >= 5) {
      concepts.push({
        term: isDefinedMatch[1].trim(),
        definition: `${isDefinedMatch[2]} ${isDefinedMatch[3]}`.trim(),
        rawSentence: cleanLine,
        category: 'Core Principle',
      });
      continue;
    }

    // Pattern 3: "X is a/an Y..."
    const isMatch = cleanLine.match(/^([A-Z][^,\s]{1,30}(?:\s+[A-Za-z0-9\-]+){0,3})\s+(is|are)\s+([a-z].+)$/);
    if (isMatch && isMatch[3].length >= 10) {
      concepts.push({
        term: isMatch[1].trim(),
        definition: `${isMatch[2]} ${isMatch[3]}`.trim(),
        rawSentence: cleanLine,
        category: 'Definition',
      });
      continue;
    }

    // Pattern 4: Causes, effects, mechanisms ("causes", "results in", "leads to", "produces")
    const causeMatch = cleanLine.match(/(.+?)\s+(causes|results in|leads to|produces|yields|triggers)\s+(.+)/i);
    if (causeMatch && causeMatch[1].length < 40 && causeMatch[3].length >= 5) {
      concepts.push({
        term: causeMatch[1].trim(),
        definition: `${causeMatch[2]} ${causeMatch[3]}`.trim(),
        rawSentence: cleanLine,
        category: 'Mechanism',
      });
      continue;
    }

    // Pattern 5: Informational fact with numbers, laws, or formulas
    if (/[0-9=+\-*/^%><]/.test(cleanLine) || cleanLine.length >= 25) {
      const words = cleanLine.split(/\s+/);
      const headTerm = words.slice(0, 3).join(' ');
      concepts.push({
        term: headTerm,
        definition: cleanLine,
        rawSentence: cleanLine,
        category: /[0-9=+]/.test(cleanLine) ? 'Formula / Fact' : 'Key Fact',
      });
    }
  }

  return concepts;
}

/**
 * Generate exactly targetCount (default 20) active-recall flashcards from extracted concepts
 */
export function generateCardsFromText(
  rawText: string,
  targetCount = 20,
  sourceType: 'camera' | 'upload' | 'sample' = 'upload'
): FlashcardDeck {
  const lines = cleanOcrText(rawText);

  if (lines.length === 0 || rawText.replace(/\s+/g, '').length < 15) {
    throw new Error(
      'Not enough readable text found in this photo. Please make sure your notes or textbook are clear, in focus, and well-illuminated.'
    );
  }

  const { title, subject } = inferDeckMetadata(lines);
  const parsedConcepts = extractConceptsFromLines(lines);

  // If no structured concepts were extracted, fallback to sentence chunks
  if (parsedConcepts.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length >= 15) {
        parsedConcepts.push({
          term: trimmed.slice(0, 25),
          definition: trimmed,
          rawSentence: trimmed,
          category: 'Key Fact',
        });
      }
    }
  }

  if (parsedConcepts.length === 0) {
    throw new Error('Could not identify clear concepts from this image. Please try another shot.');
  }

  const cards: Flashcard[] = [];
  const baseTime = Date.now();

  // Helper to add card
  const addCard = (
    front: string,
    back: string,
    concept: string,
    citation: string,
    difficulty: 'easy' | 'medium' | 'hard',
    tag: string
  ) => {
    cards.push({
      id: `card-${baseTime}-${cards.length + 1}`,
      front: front.trim(),
      back: back.trim(),
      concept: concept.trim(),
      evidenceCitation: `From notes: "${citation.trim()}"`,
      difficulty,
      tag,
      isMastered: false,
    });
  };

  // Pass 1: Primary active-recall questions from each concept
  for (let i = 0; i < parsedConcepts.length && cards.length < targetCount; i++) {
    const c = parsedConcepts[i];
    let front = '';
    const back = c.definition;

    if (c.category === 'Definition') {
      front = `What is the definition of "${c.term}"?`;
    } else if (c.category === 'Mechanism') {
      front = `How does "${c.term}" function or what does it lead to?`;
    } else if (c.category === 'Formula / Fact') {
      front = `What key formula or relationship is noted for "${c.term}"?`;
    } else {
      front = `Explain the key principle regarding "${c.term}":`;
    }

    const difficulty: 'easy' | 'medium' | 'hard' =
      c.definition.length > 100 ? 'hard' : c.definition.length > 50 ? 'medium' : 'easy';

    addCard(front, back, c.term, c.rawSentence, difficulty, c.category);
  }

  // Pass 2: Reverse recall and conceptual application (if needed to reach 20 cards)
  let conceptIndex = 0;
  while (cards.length < targetCount && parsedConcepts.length > 0) {
    const c = parsedConcepts[conceptIndex % parsedConcepts.length];
    const cardCycle = Math.floor(cards.length / parsedConcepts.length);

    if (cardCycle === 1) {
      // Reverse recall: Given the description/definition, identify the concept
      const front = `Which concept or term is described as:\n"${c.definition}"?`;
      const back = c.term;
      addCard(front, back, c.term, c.rawSentence, 'medium', 'Active Recall');
    } else if (cardCycle === 2) {
      // Significance / context check
      const front = `In the context of ${subject}, why is "${c.term}" significant?`;
      const back = `Key context from your notes: ${c.definition}`;
      addCard(front, back, c.term, c.rawSentence, 'hard', 'Analysis');
    } else {
      // True/False or key detail check
      const front = `According to your study page, what are the primary details associated with "${c.term}"?`;
      const back = c.rawSentence;
      addCard(front, back, c.term, c.rawSentence, 'medium', 'Verification');
    }

    conceptIndex++;
  }

  return {
    id: `deck-${baseTime}`,
    title,
    subject,
    createdAt: baseTime,
    sourceType,
    cards: cards.slice(0, targetCount),
  };
}
