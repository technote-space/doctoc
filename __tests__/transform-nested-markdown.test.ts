/* eslint-disable no-magic-numbers */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { transform } from '../src';

describe('transform', () => {
  it('\nhandle inline links and images', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-nested-markdown.md'), 'utf8');
    const headers = transform(content);

    expect(headers.toc.split('\n')).toEqual(
      [
        '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [CNN](#cnn)',
        '- [Get Involved *](#get-involved-)',
        '- [Translation Status *](#translation-status-)',
        '- [Building *](#building-)',
        '',
      ],
    );
  });
});
