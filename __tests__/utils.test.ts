/* eslint-disable no-magic-numbers */
import { describe, expect, it } from 'vitest';
import { replaceVariables } from '../src/lib/utils';

describe('replaceVariables', () => {
  it('should replace variables', () => {
    expect(replaceVariables('', [])).toBe('');
    expect(replaceVariables('abc/${test1}/${test2}/${test1}/xyz', [
      { key: 'test1', replace: '1' },
      { key: 'test3', replace: '3' },
    ])).toBe('abc/1/${test2}/1/xyz');
  });
});
