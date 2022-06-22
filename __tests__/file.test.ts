/* eslint-disable no-magic-numbers */
import { resolve } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { findMarkdownFiles } from '../src';

describe('findMarkdownFiles', () => {
  it('should find markdown files', () => {
    const mockLog = vi.spyOn(console, 'log').mockImplementation(() => ({}));
    expect(findMarkdownFiles(resolve(__dirname, 'fixtures')).map(info => ({
      name: info.name,
      path: info.path,
    }))).toEqual([
      {
        'name': 'readme-benign-backticks.md',
        'path': resolve(__dirname, 'fixtures/readme-benign-backticks.md'),
      },
      {
        'name': 'readme-nameless-table-headers.md',
        'path': resolve(__dirname, 'fixtures/readme-nameless-table-headers.md'),
      },
      {
        'name': 'readme-no-headers.md',
        'path': resolve(__dirname, 'fixtures/readme-no-headers.md'),
      },
      {
        'name': 'readme-not-updated.md',
        'path': resolve(__dirname, 'fixtures/readme-not-updated.md'),
      },
      {
        'name': 'readme-update-only.md',
        'path': resolve(__dirname, 'fixtures/readme-update-only.md'),
      },
      {
        'name': 'readme-with-code.md',
        'path': resolve(__dirname, 'fixtures/readme-with-code.md'),
      },
      {
        'name': 'readme-with-custom-title.md',
        'path': resolve(__dirname, 'fixtures/readme-with-custom-title.md'),
      },
      {
        'name': 'readme-with-html.md',
        'path': resolve(__dirname, 'fixtures/readme-with-html.md'),
      },
      {
        'name': 'readme-with-nested-markdown.md',
        'path': resolve(__dirname, 'fixtures/readme-with-nested-markdown.md'),
      },
      {
        'name': 'readme-with-params1.md',
        'path': resolve(__dirname, 'fixtures/readme-with-params1.md'),
      },
      {
        'name': 'readme-with-params2.md',
        'path': resolve(__dirname, 'fixtures/readme-with-params2.md'),
      },
      {
        'name': 'readme-with-weird-headers.md',
        'path': resolve(__dirname, 'fixtures/readme-with-weird-headers.md'),
      },
      {
        'name': 'readme.md',
        'path': resolve(__dirname, 'fixtures/subdir/readme.md'),
      },
    ]);
    expect(mockLog).toBeCalledTimes(3); // fixtures, fixtures/subdir, fixtures/empty
  });
});
