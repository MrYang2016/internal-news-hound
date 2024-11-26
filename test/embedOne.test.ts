import { embedOne } from '../src/common/ai';

describe('embedOne', () => {
  it('should return an array of numbers', async () => {
    const result = await embedOne('Hello, world!');
    expect(Array.isArray(result)).toBe(true);
    expect(result.every((item) => typeof item === 'number')).toBe(true);
  });
});
