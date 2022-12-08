/* eslint-disable no-magic-numbers */
import { describe, expect, it } from 'vitest';
import { CLOSING_COMMENT, OPENING_COMMENT } from '../src/index.js';
import { extractParams, getStartSection, getParamsSection } from '../src/lib/params.js';

describe('extractParams', () => {
  const opening = OPENING_COMMENT.replace('\n', ' ');
  it('should return params', () => {
    expect(extractParams(opening)).toEqual({});
    expect(extractParams(opening + '<!-- param::maxHeaderLevel::2:: param::isNotitle::true:: param::isFolding::false:: param::processAll::1:: param::updateOnly::0:: param::isCustomMode:::: -->')).toEqual({
      maxHeaderLevel: 2,
      isNotitle: true,
      isFolding: false,
      processAll: true,
      updateOnly: false,
      isCustomMode: false,
    });
    expect(extractParams(opening + '<!-- param::mode::test mode:: param::moduleName::test name:: param::title:::: param::entryPrefix::-:: -->')).toEqual({
      mode: 'test mode',
      moduleName: 'test name',
      title: '',
      entryPrefix: '-',
    });
    expect(extractParams(opening + '<!-- param::customTemplate::<ul>${ITEMS}</ul>:: param::itemTemplate::<li><a href="${LINK}" target="_blank">${TEXT}</a></li>:: param::separator:::: -->')).toEqual({
      customTemplate: '<ul>${ITEMS}</ul>',
      itemTemplate: '<li><a href="${LINK}" target="_blank">${TEXT}</a></li>',
      separator: '',
    });
    expect(extractParams(opening + '<!-- param::test1:::: param::test2:::: -->')).toEqual({});
  });
});

describe('getStartSection', () => {
  it('should return empty if hasStart is false', () => {
    expect(getStartSection(['<!-- param::test1::test1:: -->', '<!-- param::test2::test2:: -->'], {
      hasStart: false,
      hasEnd: false,
      startIdx: -1,
      endIdx: -1,
    }, () => false)).toEqual([]);
  });

  it('should return start line', () => {
    expect(getStartSection(['', ...OPENING_COMMENT.split('\n'), '<!-- param::test1::test1:: -->', '<!-- param::test2::test2:: -->'], {
      hasStart: true,
      hasEnd: true,
      startIdx: 1,
      endIdx: 5,
    }, () => false)).toEqual([OPENING_COMMENT.split('\n')[0]]);
  });

  it('should return start section', () => {
    expect(getStartSection(['', ...OPENING_COMMENT.split('\n'), '<!-- param::test1::test1:: -->', '<!-- param::test2::test2:: -->', 'title', '', CLOSING_COMMENT, '', ''], {
      hasStart: true,
      hasEnd: true,
      startIdx: 1,
      endIdx: 7,
    }, () => false)).toEqual([...OPENING_COMMENT.split('\n'), '<!-- param::test1::test1:: -->', '<!-- param::test2::test2:: -->']);
  });
});

describe('getParamsSection', () => {
  it('should return empty if no options', () => {
    expect(getParamsSection({})).toBe('');
  });

  it('should return params section', () => {
    expect(getParamsSection({
      mode: 'test mode',
      isNotitle: true,
      isFolding: false,
    })).toBe(['', '<!-- param::mode::test mode:: -->', '<!-- param::isNotitle::true:: -->', '<!-- param::isFolding::false:: -->'].join('\n'));
  });
});
