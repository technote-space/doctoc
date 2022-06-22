/* eslint-disable no-magic-numbers */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { transform } from '../src';

describe('transform', () => {
  it('run in html mode', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-html.md'), 'utf8');
    const headers = transform(content, { mode: 'github.com', isCustomMode: true });

    expect(headers.toc.split('\n')).toEqual(
      ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '<p align="center">',
        '<a href="#installation">Installation</a>',
        '<span>|</span>',
        '<a href="#api">API</a>',
        '<span>|</span>',
        '<a href="#license">^License</a>',
        '</p>',
        ''],
    );
  });

  it('run in html mode with custom settings', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-html.md'), 'utf8');
    const headers = transform(content, {
      mode: 'github.com',
      isCustomMode: true,
      customTemplate: '<ul>${ITEMS}</ul>',
      itemTemplate: '<li><a href="${LINK}" target="_blank">${TEXT}</a></li>',
      separator: '',
    });

    expect(headers.toc.split('\n')).toEqual(
      ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '<ul>',
        '<li><a href="#installation" target="_blank">Installation</a></li>',
        '',
        '<li><a href="#api" target="_blank">API</a></li>',
        '',
        '<li><a href="#license" target="_blank">^License</a></li>',
        '</ul>',
        ''],
    );
  });
});
