export interface Flashcard {
  id: string;
  front: string;
  back: string;
  concept: string;
  evidenceCitation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tag: string;
  isMastered?: boolean;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  createdAt: number;
  imageThumbnail?: string;
  sourceType: 'camera' | 'upload' | 'sample';
  cards: Flashcard[];
}

/**
 * Format cards for Anki (.txt TSV format with Front\tBack\tTags)
 */
export function exportToAnkiTSV(deck: FlashcardDeck): string {
  const header = `#separator:tab\n#html:false\n#tags column:3\n`;
  const rows = deck.cards.map((c) => {
    const cleanFront = c.front.replace(/[\t\n\r]/g, ' ').trim();
    const cleanBack = c.back.replace(/[\t\n\r]/g, ' ').trim();
    const cleanTag = (c.tag || c.concept || 'SnapDeck').replace(/[\t\s]/g, '_');
    return `${cleanFront}\t${cleanBack}\t${cleanTag}`;
  });
  return header + rows.join('\n');
}

/**
 * Format cards for Quizlet (tab separated question and answer, newline separated rows)
 */
export function exportToQuizletText(deck: FlashcardDeck): string {
  return deck.cards
    .map((c) => {
      const cleanFront = c.front.replace(/[\t\r]/g, ' ').trim();
      const cleanBack = c.back.replace(/[\t\r]/g, ' ').trim();
      return `${cleanFront}\t${cleanBack}`;
    })
    .join('\n');
}

/**
 * Calculate mastery stats for a deck
 */
export function calculateMasteryStats(cards: Flashcard[]): {
  total: number;
  mastered: number;
  remaining: number;
  percentage: number;
} {
  const total = cards.length;
  if (total === 0) {
    return { total: 0, mastered: 0, remaining: 0, percentage: 0 };
  }
  const mastered = cards.filter((c) => c.isMastered).length;
  const remaining = total - mastered;
  const percentage = Math.round((mastered / total) * 100);
  return { total, mastered, remaining, percentage };
}

/**
 * Validates and normalizes raw cards returned by AI
 */
export function normalizeGeneratedCards(
  rawCards: Partial<Flashcard>[],
  deckTitle = 'Study Deck'
): Flashcard[] {
  if (!Array.isArray(rawCards) || rawCards.length === 0) {
    return [];
  }

  return rawCards.map((card, index) => ({
    id: card.id || `card-${Date.now()}-${index}`,
    front: card.front?.trim() || `Concept ${index + 1} Prompt`,
    back: card.back?.trim() || 'No answer provided.',
    concept: card.concept?.trim() || deckTitle,
    evidenceCitation:
      card.evidenceCitation?.trim() || 'Derived from source material notes.',
    difficulty:
      card.difficulty === 'easy' || card.difficulty === 'hard'
        ? card.difficulty
        : 'medium',
    tag: card.tag?.trim() || 'Key Concept',
    isMastered: false,
  }));
}
