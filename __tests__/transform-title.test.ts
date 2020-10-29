/* eslint-disable no-magic-numbers */
import {resolve} from 'path';
import {readFileSync} from 'fs';
import {transform} from '../src';

describe('transform', () => {
  it('overwrite existing title', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-custom-title.md'), 'utf8');
    const headers = transform(content, {title: '## Table of Contents'});

    expect(headers.toc.split('\n')).toEqual(
      ['## Table of Contents',
        '',
        '- [Installation](#installation)',
        '- [API](#api)',
        '- [License](#license)',
        ''],
    );
  });

  it('do not overwrite existing title', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-custom-title.md'), 'utf8');
    const headers = transform(content);

    expect(headers.toc.split('\n')).toEqual(
      ['## Table of Contents',
        '',
        '- [Installation](#installation)',
        '- [API](#api)',
        '- [License](#license)',
        ''],
    );
  });

  it('clobber existing title', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-custom-title.md'), 'utf8');
    const headers = transform(content, {isNotitle: true});

    expect(headers.toc.split('\n')).toEqual(
      ['',
        '- [Installation](#installation)',
        '- [API](#api)',
        '- [License](#license)',
        ''],
    );
  });
});
