/* eslint-disable no-magic-numbers */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { transform } from '../src/index.js';

describe('transform', () => {
  it('add footer', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-custom-title.md'), 'utf8');
    const headers = transform(content, { title: '## Table of Contents', footer: '*generated with [TOC Generator](https://github.com/technote-space/toc-generator)*' });

    expect(headers.toc.split('\n')).toEqual(
      ['## Table of Contents',
        '',
        '- [Installation](#installation)',
        '- [API](#api)',
        '- [License](#license)',
        '',
        '*generated with [TOC Generator](https://github.com/technote-space/toc-generator)*',
        ''],
    );
  });
});
