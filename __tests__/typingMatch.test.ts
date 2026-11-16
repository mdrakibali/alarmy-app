import {
  checkTypingMatch,
} from '../src/features/missions/TypingMissionScreen';

describe('TypingMissionScreen matching logic', () => {
  const target = 'Every morning is a new opportunity to achieve greatness.';

  test('matches exact sentence', () => {
    expect(checkTypingMatch(target, target)).toBe(true);
  });

  test('matches sentence with user-typed quotation marks', () => {
    // Exactly what happened in user screenshot
    expect(checkTypingMatch(`"${target}"`, target)).toBe(true);
    expect(checkTypingMatch(`“${target}”`, target)).toBe(true);
    expect(checkTypingMatch(`'${target}'`, target)).toBe(true);
  });

  test('matches case-insensitively and ignores missing punctuation', () => {
    const inputWithoutPeriod = 'every morning is a new opportunity to achieve greatness';
    expect(checkTypingMatch(inputWithoutPeriod, target)).toBe(true);
  });

  test('matches with extra whitespace', () => {
    const inputExtraSpaces = 'Every   morning is a  new opportunity to achieve greatness.  ';
    expect(checkTypingMatch(inputExtraSpaces, target)).toBe(true);
  });

  test('does not match incorrect text', () => {
    expect(checkTypingMatch('Hello world', target)).toBe(false);
    expect(checkTypingMatch('', target)).toBe(false);
  });
});

