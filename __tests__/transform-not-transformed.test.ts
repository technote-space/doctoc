/* eslint-disable no-magic-numbers */
import {resolve} from 'path';
import {readFileSync} from 'fs';
import {transform} from '../src';

describe('transform', () => {
  it('update only', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-update-only.md'), 'utf8');
    const headers = transform(content, {updateOnly: true});

    expect(headers.transformed).toBe(false);
    expect(headers.reason).toBe('update only');
  });

  it('no headers', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-no-headers.md'), 'utf8');
    const headers = transform(content);

    expect(headers.transformed).toBe(false);
    expect(headers.reason).toBe('no headers');
  });

  it('not updated', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-not-updated.md'), 'utf8');
    const headers = transform(content);

    expect(headers.transformed).toBe(false);
    expect(headers.reason).toBe('not updated');
  });
});
