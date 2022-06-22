/* eslint-disable no-magic-numbers */
import { describe, expect, it } from 'vitest';
import { transform } from '../src';
import { getLinesToToc, matchesStart, matchesEnd } from '../src/lib/transform';
import { OPENING_COMMENT, CLOSING_COMMENT } from '../src';

const check = (
  name: string,
  md: string,
  anchors: string,
  mode?: string,
  maxHeaderLevel?: number,
  title?: string,
  isNotitle?: boolean,
  isFolding?: boolean,
  entryPrefix?: string,
  processAll?: boolean,
  openingComment?: string,
  closingComment?: string,
) => {
  it(name, () => {
    const res = transform(md, {
      mode,
      maxHeaderLevel,
      title,
      isNotitle,
      isFolding,
      entryPrefix,
      processAll,
      openingComment,
      closingComment,
    });

    // remove wrapper
    const data = res.data.split('\n');

    // rig our expected value to include the wrapper
    const startLines  = (openingComment ?? OPENING_COMMENT).split('\n');
    const anchorLines = anchors.split('\n');
    const endLines    = (closingComment ?? CLOSING_COMMENT).split('\n');
    const mdLines     = md.split('\n');

    const rig = startLines
      .concat(anchorLines.slice(0, -2))
      .concat(endLines)
      .concat('')
      .concat(mdLines);
    expect(res.transformed).toBe(true);
    expect(data).toEqual(rig);
  });
};

describe('transform', () => {
  check(
    'should create toc 1',
    ['# My Module',
      'Some text here',
      '## API',
      '### Method One',
      'works like this',
      '### Method Two',
      '#### Main Usage',
      'some main usage here',
    ].join('\n')
    , ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [My Module](#my-module)\n',
      '  - [API](#api)\n',
      '    - [Method One](#method-one)\n',
      '    - [Method Two](#method-two)\n',
      '      - [Main Usage](#main-usage)\n\n\n',
    ].join(''),
  );


  check(
    'should create toc 2',
    ['My Module',
      '=========',
      'Some text here',
      '',
      'API',
      '---------',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [My Module](#my-module)\n',
      '  - [API](#api)\n\n\n',
    ].join(''),
  );

  check(
    'should create toc (different line endings)',
    ['# My Module using \\r\\n line endings',
      'Some text here',
      '## API',
      '### Method One',
      'works like this',
      '### Method Two',
      '#### Main Usage',
      'some main usage here',
    ].join('\r\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [My Module using \\r\\n line endings](#my-module-using-%5Cr%5Cn-line-endings)\n',
      '  - [API](#api)\n',
      '    - [Method One](#method-one)\n',
      '    - [Method Two](#method-two)\n',
      '      - [Main Usage](#main-usage)\n\n\n',
    ].join(''),
  );

  check(
    'should remove some chars',
    ['# My Module !"#$%&\'()=~¥@[];:*+{}',
      'Some text here',
      '## API ##',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [My Module !"&#035;$%&\'()=~¥@&#91;&#93;;:*+{}](#my-module-)\n',
      '  - [API](#api)\n\n\n',
    ].join(''),
  );

  check(
    'should include title',
    ['## Title should be included',
      '',
      '```js',
      'function foo () {',
      '  // ## This title should be ignored',
      '}',
      '## This title should also be ignored',
      '```',
      '',
      '## Title should also be included',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [Title should be included](#title-should-be-included)\n',
      '- [Title should also be included](#title-should-also-be-included)\n\n\n',
    ].join(''),
  );

  check(
    'should replace title',
    ['# Repeating A Title',
      '',
      '# Repeating A Title',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [Repeating A Title](#repeating-a-title)\n',
      '- [Repeating A Title](#repeating-a-title-1)\n\n\n',
    ].join(''),
  );

  check(
    'should not be header',
    ['## Header',
      'some content',
      '-- preceded by two dashes but has content, therefore "some content" should not be header',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [Header](#header)\n\n\n',
    ].join(''),
  );

  check(
    'should create toc (different kinds 1)',
    ['# Different Kinds',
      '',
      'In the Right Order',
      '==================',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [Different Kinds](#different-kinds)\n',
      '- [In the Right Order](#in-the-right-order)\n\n\n',
    ].join(''),
  );

  check(
    'should create toc (different kinds 2)',
    ['Different Kinds 2',
      '===============',
      '',
      '# In the Right Order 2',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [Different Kinds 2](#different-kinds-2)\n',
      '- [In the Right Order 2](#in-the-right-order-2)\n\n\n',
    ].join(''),
  );

  check(
    'should render custom title',
    ['# Heading',
      '',
      'Custom TOC title test',
    ].join('\n'),
    ['**Contents**\n\n',
      '- [Heading](#heading)\n\n\n',
    ].join(''),
    undefined,
    undefined,
    '**Contents**',
  );

  check(
    'should not be header (maxHeaderLevel 1)',
    ['# H1h',
      '## H2h',
      '### H3h',
      '',
      'Max. level test - hashed',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [H1h](#h1h)\n',
      '  - [H2h](#h2h)\n\n\n',
    ].join(''),
    undefined,
    2,
  );

  check(
    'should not be header (maxHeaderLevel 2)',
    [
      'H1u',
      '===',
      'H2u',
      '---',
      '',
      'Max. level test - underlined',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [H1u](#h1u)\n\n\n',
    ].join(''),
    undefined,
    1,
  );

  check(
    'should not be header (maxHeaderLevel 3)',
    [
      '<html lang="en"><head><title></title></head><body>',
      '<h1>H1html</h1><h2>H2html</h2><h3>H3html</h3>',
      '</body></html>',
      'Max. level test - HTML',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [H1html](#h1html)\n',
      '  - [H2html](#h2html)\n\n\n',
    ].join(''),
    undefined,
    2,
  );

  check(
    'should not render title',
    ['# Heading',
      '',
      'No TOC title test',
    ].join('\n'),
    ['\n',
      '- [Heading](#heading)\n\n\n',
    ].join(''),
    undefined,
    undefined,
    '**Contents**',
    true,
  );

  check(
    'should be folding',
    ['# Heading',
      '',
      'Folding test',
    ].join('\n'),
    ['<details>\n',
      '<summary>Contents</summary>\n\n',
      '- [Heading](#heading)\n\n',
      '</details>\n\n',
    ].join(''),
    undefined,
    undefined,
    '**Contents**',
    false,
    true,
  );

  check(
    'should override toc comment',
    ['# Heading',
      '',
      'toc comment test',
    ].join('\n'),
    ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [Heading](#heading)\n\n\n',
    ].join(''),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    '<!-- toc -->',
    '<!-- tocstop -->',
  );

  // bigbucket.org
  check(
    'should create toc (mode = bigbucket.org)',
    ['# My Module',
      'Some text here',
      '## API',
      '### Method One',
      'works like this',
      '### Method Two',
      '#### Main Usage',
      'some main usage here',
    ].join('\n')
    , ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [My Module](#markdown-header-my-module)\n',
      '    - [API](#markdown-header-api)\n',
      '        - [Method One](#markdown-header-method-one)\n',
      '        - [Method Two](#markdown-header-method-two)\n',
      '            - [Main Usage](#markdown-header-main-usage)\n\n\n',
    ].join(''),
    'bitbucket.org',
  );

  // gitlab (similar to bitbucket) both have 4-spaces indentation
  // however headers are note prefixed in bitbucket specific way
  check(
    'should create toc (mode = gitlab.com)',
    ['# My Module',
      'Some text here',
      '## API',
      '### Method One',
      'works like this',
      '### Method Two',
      '#### Main Usage',
      'some main usage here',
    ].join('\n')
    , ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '- [My Module](#my-module)\n',
      '    - [API](#api)\n',
      '        - [Method One](#method-one)\n',
      '        - [Method Two](#method-two)\n',
      '            - [Main Usage](#main-usage)\n\n\n',
    ].join(''),
    'gitlab.com',
  );

  // check the --entryPrefix flag
  check(
    'should replace entry prefix 1',
    ['# My Module',
      'Some text here',
      '## API',
      '### Method One',
      'works like this',
      '### Method Two',
      '#### Main Usage',
      'some main usage here',
    ].join('\n')
    , ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '* [My Module](#my-module)\n',
      '  * [API](#api)\n',
      '    * [Method One](#method-one)\n',
      '    * [Method Two](#method-two)\n',
      '      * [Main Usage](#main-usage)\n\n\n',
    ].join(''),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    '*', // pass '*' as the prefix for toc entries
  );

  check(
    'should replace entry prefix 2',
    ['# My Module',
      'Some text here',
      '## API',
      '### Method One',
      'works like this',
      '### Method Two',
      '#### Main Usage',
      'some main usage here',
    ].join('\n')
    , ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '>> [My Module](#my-module)\n',
      '  >> [API](#api)\n',
      '    >> [Method One](#method-one)\n',
      '    >> [Method Two](#method-two)\n',
      '      >> [Main Usage](#main-usage)\n\n\n',
    ].join(''),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    '>>', // pass '>>' as the prefix for toc entries)
  );

  check(
    'should replace entry prefix 3',
    ['# My Module',
      'Some text here',
      '## API',
      '### Method One',
      'works like this',
      '### Method Two',
      '#### Main Usage',
      'some main usage here',
    ].join('\n')
    , ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*\n\n',
      '1. [My Module](#my-module)\n',
      '  1. [API](#api)\n',
      '    1. [Method One](#method-one)\n',
      '    1. [Method Two](#method-two)\n',
      '      1. [Main Usage](#main-usage)\n\n\n',
    ].join(''),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    '1.', // pass '1.' as the prefix for toc entries
  );

  it('transforming when old toc exists', () => {
    const md = [
      '# Header above',
      '',
      'The above header should be ignored since it is above the existing toc',
      '',
      '<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
      '<!-- DON\'T EDIT THIS SECTION INSTEAD RE-RUN doctoc TO UPDATE -->',
      '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
      '',
      '- [OldHeader](#oldheader)',
      '',
      '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
      '## Header',
      'some content',
      '',
    ].join('\n');

    const res = transform(md);

    expect(res.transformed).toBe(true);
    expect(res.toc.split('\n')).toEqual(
      ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Header](#header)',
        ''],
    );
    expect(res.wrappedToc.split('\n')).toEqual(
      ['<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
        '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->',
        '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Header](#header)',
        '',
        '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
      ],
    );
    expect(res.data.split('\n')).toEqual(
      ['# Header above',
        '',
        'The above header should be ignored since it is above the existing toc',
        '',
        '<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
        '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->',
        '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Header](#header)',
        '',
        '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
        '## Header',
        'some content',
        ''],
    );
  });

  it('transforming when old toc exists and --all flag is set', () => {
    const md = [
      '# Header above',
      '',
      'The above header should be ignored since it is above the existing toc',
      '',
      '<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
      '<!-- DON\'T EDIT THIS SECTION INSTEAD RE-RUN doctoc TO UPDATE -->',
      '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
      '',
      '- [OldHeader](#oldheader)',
      '',
      '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
      '## Header',
      'some content',
      '',
    ].join('\n');

    const res = transform(md, { processAll: true });

    expect(res.transformed).toBe(true);
    expect(res.toc.split('\n')).toEqual(
      ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Header above](#header-above)',
        '  - [Header](#header)',
        ''],
    );
    expect(res.wrappedToc.split('\n')).toEqual(
      ['<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
        '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->',
        '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Header above](#header-above)',
        '  - [Header](#header)',
        '',
        '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
      ],
    );
    expect(res.data.split('\n')).toEqual(
      ['# Header above',
        '',
        'The above header should be ignored since it is above the existing toc',
        '',
        '<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
        '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->',
        '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Header above](#header-above)',
        '  - [Header](#header)',
        '',
        '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
        '## Header',
        'some content',
        ''],
    );
  });
});

describe('getLinesToToc', () => {
  it('should return lines 1', () => {
    expect(getLinesToToc([
      '1', '2', '3',
    ], 'a', {
      hasStart: true,
      hasEnd: true,
      startIdx: 0,
      endIdx: 1,
    }, true)).toEqual([
      '1', '2', '3',
    ]);
  });

  it('should return lines 2', () => {
    expect(getLinesToToc([
      '1', '2', '3',
    ], '', {
      hasStart: true,
      hasEnd: true,
      startIdx: 0,
      endIdx: 1,
    }, false)).toEqual([
      '1', '2', '3',
    ]);
  });

  it('should return lines 3', () => {
    expect(getLinesToToc([
      '1', '2', '3',
    ], 'a', {
      hasStart: true,
      hasEnd: false,
      startIdx: 0,
      endIdx: 1,
    }, false)).toEqual([
      '1', '2', '3',
    ]);
  });

  it('should return sliced lines', () => {
    expect(getLinesToToc([
      '1', '2', '3',
    ], 'a', {
      hasStart: true,
      hasEnd: true,
      startIdx: 0,
      endIdx: 1,
    }, false)).toEqual([
      '3',
    ]);
  });
});

describe('matchesStart', () => {
  it('should return true', () => {
    expect(matchesStart()('<!-- START doctoc -->')).toBe(true);
    expect(matchesStart()('<!-- START doctoc generated TOC please keep comment here to allow auto update -->')).toBe(true);
    expect(matchesStart(['<!-- test '])('<!-- test abc -->')).toBe(true);
  });

  it('should return false', () => {
    expect(matchesStart()('<!-- doctoc -->')).toBe(false);
    expect(matchesStart(['<!-- test '])('<!-- START doctoc -->')).toBe(false);
  });
});

describe('matchesEnd', () => {
  it('should return true', () => {
    expect(matchesEnd()('<!-- END doctoc -->')).toBe(true);
    expect(matchesEnd()('<!-- END doctoc generated TOC please keep comment here to allow auto update -->')).toBe(true);
    expect(matchesEnd(['<!-- test '])('<!-- test abc -->')).toBe(true);
  });

  it('should return false', () => {
    expect(matchesEnd()('<!-- doctoc -->')).toBe(false);
    expect(matchesEnd(['<!-- test '])('<!-- END doctoc -->')).toBe(false);
  });
});
