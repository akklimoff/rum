import { expect, test } from 'vitest';
import { barsLabel } from './plural';

test('bars are counted in correct Russian', () => {
  expect([1, 2, 5, 11, 21, 33, 42, 112].map(barsLabel)).toEqual([
    '1 такт', '2 такта', '5 тактов', '11 тактов', '21 такт', '33 такта', '42 такта', '112 тактов',
  ]);
});
