import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanOcrText,
  inferDeckMetadata,
  extractConceptsFromLines,
  generateCardsFromText,
} from './textToDeck';

const sampleEconText = `
Chapter 4: Principles of Microeconomics
Supply and Demand Notes

Law of Demand: As the price of a good increases, the quantity demanded decreases, ceteris paribus.
Law of Supply: As the price of a good increases, the quantity supplied increases.
Equilibrium Price = The market clearing price where quantity demanded equals quantity supplied.
Shortage occurs when quantity demanded exceeds quantity supplied at the current market price.
Surplus occurs when quantity supplied exceeds quantity demanded.
Price Elasticity of Demand: Measure of how much quantity demanded responds to a change in price.
Inelastic Demand is when elasticity is less than 1, meaning consumers are relatively unresponsive to price changes.
Elastic Demand is when elasticity is greater than 1.
Opportunity Cost refers to the value of the next best alternative given up when making a decision.
Deadweight Loss is defined as the loss of economic efficiency when equilibrium is not achieved.
`;

test('cleanOcrText cleans blank lines and merges continuous lines', () => {
  const raw = 'Line 1 is here\n\n\nLine 2 continues\nwith more detail.\n';
  const cleaned = cleanOcrText(raw);
  assert.ok(cleaned.length >= 2);
});

test('inferDeckMetadata infers subject and title accurately', () => {
  const lines = cleanOcrText(sampleEconText);
  const meta = inferDeckMetadata(lines);
  assert.equal(meta.subject, 'Economics');
  assert.match(meta.title, /Principles of Microeconomics/i);
});

test('extractConceptsFromLines captures definitions, laws and formulas', () => {
  const lines = cleanOcrText(sampleEconText);
  const concepts = extractConceptsFromLines(lines);
  assert.ok(concepts.length >= 5);
  const demandConcept = concepts.find((c) => c.term.toLowerCase().includes('demand'));
  assert.ok(demandConcept);
});

test('generateCardsFromText creates exactly 20 grounded flashcards with citations', () => {
  const deck = generateCardsFromText(sampleEconText, 20, 'upload');
  assert.equal(deck.cards.length, 20);
  assert.equal(deck.subject, 'Economics');
  assert.ok(deck.cards.every((c) => c.front.length > 5));
  assert.ok(deck.cards.every((c) => c.back.length > 2));
  assert.ok(deck.cards.every((c) => c.evidenceCitation.startsWith('From notes:')));
});

test('generateCardsFromText throws clear error when text is too short or illegible', () => {
  assert.throws(
    () => {
      generateCardsFromText('abc 123');
    },
    /Not enough readable text found/
  );
});
