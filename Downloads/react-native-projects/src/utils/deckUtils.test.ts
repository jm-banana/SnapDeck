import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exportToAnkiTSV,
  exportToQuizletText,
  calculateMasteryStats,
  normalizeGeneratedCards,
  FlashcardDeck,
  Flashcard,
} from './deckUtils';

const mockCards: Flashcard[] = [
  {
    id: 'c1',
    front: 'What is glycolysis?',
    back: 'Anaerobic breakdown of glucose to pyruvate yielding 2 ATP and 2 NADH.',
    concept: 'Cellular Respiration',
    evidenceCitation: 'Section 4.1: Glycolysis occurs in cytosol without O2.',
    difficulty: 'medium',
    tag: 'Mechanism',
    isMastered: true,
  },
  {
    id: 'c2',
    front: 'Where does the Krebs Cycle occur?',
    back: 'Mitochondrial matrix.',
    concept: 'Cellular Respiration',
    evidenceCitation: 'Section 4.3: Citric acid cycle location.',
    difficulty: 'easy',
    tag: 'Anatomy',
    isMastered: false,
  },
];

const mockDeck: FlashcardDeck = {
  id: 'deck-1',
  title: 'Biology 101 - Cell Respiration',
  subject: 'Biology',
  createdAt: 1700000000000,
  sourceType: 'camera',
  cards: mockCards,
};

test('exportToAnkiTSV formats with valid tab separated columns and header', () => {
  const result = exportToAnkiTSV(mockDeck);
  assert.match(result, /^#separator:tab/);
  assert.ok(result.includes('What is glycolysis?\tAnaerobic breakdown of glucose to pyruvate yielding 2 ATP and 2 NADH.\tMechanism'));
  assert.ok(result.includes('Where does the Krebs Cycle occur?\tMitochondrial matrix.\tAnatomy'));
});

test('exportToQuizletText formats rows as question tab answer', () => {
  const result = exportToQuizletText(mockDeck);
  const lines = result.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], 'What is glycolysis?\tAnaerobic breakdown of glucose to pyruvate yielding 2 ATP and 2 NADH.');
  assert.equal(lines[1], 'Where does the Krebs Cycle occur?\tMitochondrial matrix.');
});

test('calculateMasteryStats calculates correct percentage and counts', () => {
  const stats = calculateMasteryStats(mockCards);
  assert.equal(stats.total, 2);
  assert.equal(stats.mastered, 1);
  assert.equal(stats.remaining, 1);
  assert.equal(stats.percentage, 50);

  const emptyStats = calculateMasteryStats([]);
  assert.equal(emptyStats.total, 0);
  assert.equal(emptyStats.percentage, 0);
});

test('normalizeGeneratedCards sanitizes inputs and fills defaults', () => {
  const raw = [
    {
      front: '  What is Newton’s First Law?  ',
      back: 'An object remains at rest unless acted upon by a net force.',
      concept: 'Classical Mechanics',
    },
    {
      // Missing fields
      front: '',
      back: '',
    },
  ];

  const normalized = normalizeGeneratedCards(raw, 'Physics 101');
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].front, 'What is Newton’s First Law?');
  assert.equal(normalized[0].difficulty, 'medium');
  assert.equal(normalized[0].tag, 'Key Concept');
  assert.equal(normalized[1].front, 'Concept 2 Prompt');
  assert.equal(normalized[1].back, 'No answer provided.');
});
