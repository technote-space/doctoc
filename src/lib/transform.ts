import type { TransformOptions, Header, HeaderWithRepetition, HeaderWithAnchor, SectionInfo, TransformResult } from '../types.js';
import type { TxtNode } from '@textlint/ast-node-types';
import { anchor, getUrlHash } from '@technote-space/anchor-markdown-header';
import * as md from '@textlint/markdown-to-ast';
import updateSection from 'update-section';
import {
  OPENING_COMMENT,
  CLOSING_COMMENT,
  CHECK_OPENING_COMMENT,
  CHECK_CLOSING_COMMENT,
  CHECK_SKIP_COMMENT,
  DEFAULT_TITLE,
  DEFAULT_CUSTOM_TEMPLATE,
  DEFAULT_ITEM_TEMPLATE,
  DEFAULT_SEPARATOR,
} from '../constant.js';
import { getHtmlHeaders } from './get-html-headers.js';
import { getStartSection, extractParams, getParamsSection } from './params.js';
import { replaceVariables } from './utils.js';

const getTargetComments = (checkComments: Array<string>, defaultComments: string): Array<string> => {
  if (checkComments.length) {
    return checkComments;
  }

  return [defaultComments];
};

export const matchesStart = (checkOpeningComments?: Array<string>) => (line: string): boolean => getTargetComments(checkOpeningComments ?? [], CHECK_OPENING_COMMENT).some(comment => new RegExp(comment).test(line));
export const matchesEnd   = (checkClosingComments?: Array<string>) => (line: string): boolean => getTargetComments(checkClosingComments ?? [], CHECK_CLOSING_COMMENT).some(comment => new RegExp(comment).test(line));
export const matchesSkip  = (checkSkipComments?: Array<string>) => (line: string): boolean => getTargetComments(checkSkipComments ?? [], CHECK_SKIP_COMMENT).some(comment => new RegExp(comment).test(line));
const addAnchor           = (mode: string, moduleName: string | undefined, header: HeaderWithRepetition): HeaderWithAnchor => {
  return {
    ...header,
    anchor: anchor(header.name, mode, header.repetition, moduleName),
    hash: getUrlHash(header.name, mode, header.repetition, moduleName),
  };
};

// eslint-disable-next-line no-magic-numbers
const shouldEscape = (header: TxtNode): boolean => /^#+\s+/.test(header.raw) && !/\s+#+$/.test(header.raw) && header.children.length === 1 && header.children[0].type === md.Syntax.Str;
const escapeHeader = (header: TxtNode): TxtNode => md.parse(header.raw.replace(/^#+\s+/, '').replace('&#035;', '#').replace('#', '&#035;').replace(']', '&#93;').replace('[', '&#91;').trim());

export const getMarkdownHeaders = (lines: Array<string>, maxHeaderLevel: number | undefined): Array<Header> => {
  const extractText = (header: TxtNode): string => {
    const target = shouldEscape(header) ? escapeHeader(header) : header;
    return target.children
      .map(node => {
        if (node.type === md.Syntax.Link) {
          return extractText(node);
        }

        if (node.type === md.Syntax.Image) {
          // Images (at least on GitHub, untested elsewhere) are given a hyphen
          // in the slug. We can achieve this behavior by adding an '*' to the
          // TOC entry. Think of it as a "magic char" that represents the iamge.
          return '*';
        }

        return node.raw;
      }).join('');
  };

  const toHeader = (header: TxtNode): Header | null => !maxHeaderLevel || header.depth <= maxHeaderLevel ? {
    line: header.loc.start.line,
    rank: header.depth,
    name: extractText(header),
  } : null;

  return md.parse(lines.join('\n')).children.filter((node: TxtNode) => node.type === md.Syntax.Header).map(toHeader).filter(item => item !== null);
};

export const countHeaders = (headers: Array<Pick<Header, 'rank' | 'name' | 'line'>>, mode: string, moduleName: string | undefined): Array<HeaderWithRepetition> => {
  const repetitions = {};
  return headers.map(header => {
    const name = getUrlHash(header.name, mode, undefined, moduleName);
    if (Object.prototype.hasOwnProperty.call(repetitions, name)) {
      repetitions[name]++;
    } else {
      repetitions[name] = 0;
    }

    return {
      ...header,
      repetition: repetitions[name],
    };
  });
};

export const getLinesToToc = (lines: Array<string>, currentToc: string | false, info: SectionInfo, processAll: boolean | undefined): Array<string> => {
  if (processAll || !currentToc) {
    return lines;
  }

  // when updating an existing toc, we only take the headers into account
  // that are below the existing toc
  if (info.hasEnd) {
    // eslint-disable-next-line no-magic-numbers
    return lines.slice(info.endIdx + 1);
  }

  return lines;
};

export const getTitle = (title: string | undefined, lines: Array<string>, info: SectionInfo, startSection: Array<string>, matchesEnd: (line: string) => boolean): string => {
  if (title) {
    return title;
  }

  if (info.hasStart && lines[info.startIdx + startSection.length]!.trim()) {
    if (matchesEnd(lines[info.startIdx + startSection.length]!)) {
      return DEFAULT_TITLE;
    }

    return lines[info.startIdx + startSection.length]!.trim();
  }

  return DEFAULT_TITLE;
};

const wrapTitle = (title: string, isFolding: boolean | undefined): string => isFolding && title !== '' ? `<summary>${title.replace(/^([*_]*)(.+)\1$/, '$2')}</summary>` : title;
const wrapToc   = (toc: string, title: string, isFolding: boolean | undefined): string => isFolding && title !== '' ? `<details>\n${toc}\n</details>` : toc;

// Use document context as well as command line args to infer the title
const determineTitle = (title: string | undefined, isNotitle: boolean | undefined, isFolding: boolean | undefined, lines: Array<string>, info: SectionInfo, startSection: Array<string>, matchesEnd: (line: string) => boolean): string => {
  if (isNotitle) {
    return '';
  }

  return wrapTitle(getTitle(title, lines, info, startSection, matchesEnd), isFolding);
};

const getHeaderContents = (headers: Array<HeaderWithAnchor>, indentation: string, lowestRank: number, entryPrefix: string): string => headers.map(header => getHeaderItem(header, indentation, lowestRank, entryPrefix)).join('\n');

const getHeaderItem = (header: HeaderWithAnchor, indentation: string, lowestRank: number, entryPrefix: string): string => {
  return `${indentation.repeat(header.rank - lowestRank)}${entryPrefix} ${header.anchor}`;
};

const getHtmlHeaderContents = (headers: Array<HeaderWithAnchor>, lowestRank: number, customTemplate: string | undefined, itemTemplate: string | undefined, separator: string | undefined): string => replaceVariables(customTemplate ?? DEFAULT_CUSTOM_TEMPLATE, [{
  key: 'ITEMS',
  replace: `\n${headers.filter(header => header.rank === lowestRank).map(header => getHeaderItemHtml(header, itemTemplate)).join(`\n${separator ?? DEFAULT_SEPARATOR}\n`)}\n`,
}]);

const getHeaderItemHtml = (header: HeaderWithAnchor, itemTemplate: string | undefined): string => {
  return replaceVariables(itemTemplate ?? DEFAULT_ITEM_TEMPLATE, [
    { key: 'LINK', replace: `#${header.hash}` },
    { key: 'TEXT', replace: header.name },
  ]);
};

const buildToc = (
  isCustomMode: boolean | undefined,
  inferredTitle: string,
  linkedHeaders: HeaderWithAnchor[],
  lowestRank: number,
  customTemplate: string | undefined,
  itemTemplate: string | undefined,
  separator: string | undefined,
  indentation: string,
  entryPrefix: string,
  footer: string | undefined,
): string => inferredTitle + (inferredTitle ? '\n\n' : '\n') +
  (isCustomMode ? getHtmlHeaderContents(linkedHeaders, lowestRank, customTemplate, itemTemplate, separator) : getHeaderContents(linkedHeaders, indentation, lowestRank, entryPrefix)) + '\n' +
  (footer ? `\n${footer}\n` : '');

type ResultArgs = {
  transformed: true;
  result: Omit<TransformResult, 'transformed' | 'reason'>
} | {
  transformed: false;
  reason: string;
}
const getResult = (result: ResultArgs): TransformResult => ({
  transformed: result.transformed,
  ...(result.transformed ? {
    ...result.result,
    reason: '',
  } : {
    data: '',
    toc: '',
    wrappedToc: '',
    reason: result.reason,
  }),
});

export const transform = (
  content: string,
  options: TransformOptions = {},
): TransformResult => {
  const lines = content.split('\n');
  if (lines.some(matchesSkip(options.checkSkipComments))) {
    return getResult({ transformed: false, reason: 'skipped' });
  }

  const info: SectionInfo = updateSection.parse(lines, matchesStart(options.checkOpeningComments), matchesEnd(options.checkClosingComments));

  const startSection     = getStartSection(lines, info, matchesEnd(options.checkClosingComments));
  const extractedOptions = extractParams(startSection.join(' '));
  const _option          = { ...options, ...extractedOptions };

  if (!info.hasStart && _option.updateOnly) {
    return getResult({ transformed: false, reason: 'update only' });
  }

  const _mode        = _option.mode || 'github.com';
  const _entryPrefix = _option.entryPrefix || '-';

  // only limit *HTML* headings by default
  // eslint-disable-next-line no-magic-numbers
  const maxHeaderLevelHtml = _option.maxHeaderLevel || 4;

  // eslint-disable-next-line no-magic-numbers
  const currentToc = info.hasStart && lines.slice(info.startIdx, info.endIdx + 1).join('\n');
  const linesToToc = getLinesToToc(lines, currentToc, info, _option.processAll);
  const headers    = getMarkdownHeaders(linesToToc, _option.maxHeaderLevel).concat(getHtmlHeaders(linesToToc, maxHeaderLevelHtml));
  headers.sort((header1, header2) => header1.line - header2.line);

  const allHeaders    = countHeaders(headers, _mode, _option.moduleName);
  const lowestRank    = Math.min(...allHeaders.map(header => header.rank));
  const linkedHeaders = allHeaders.map(header => addAnchor(_mode, _option.moduleName, header));
  const inferredTitle = linkedHeaders.length ? determineTitle(_option.title, _option.isNotitle, _option.isFolding, lines, info, startSection, matchesEnd(options.checkClosingComments)) : '';

  // 4 spaces required for proper indention on Bitbucket and GitLab
  const indentation = (_mode === 'bitbucket.org' || _mode === 'gitlab.com') ? '    ' : '  ';
  const toc         = buildToc(_option.isCustomMode, inferredTitle, linkedHeaders, lowestRank, _option.customTemplate, _option.itemTemplate, _option.separator, indentation, _entryPrefix, _option.footer);
  const wrappedToc  = (_option.openingComment ?? OPENING_COMMENT) + getParamsSection(extractedOptions) + '\n' + wrapToc(toc, inferredTitle, _option.isFolding) + '\n' + (_option.closingComment ?? CLOSING_COMMENT);
  if (currentToc === wrappedToc) {
    return getResult({ transformed: false, reason: 'not updated' });
  }

  return getResult({
    transformed: true,
    result: {
      data: updateSection(lines.join('\n'), wrappedToc, matchesStart(options.checkOpeningComments), matchesEnd(options.checkClosingComments), true),
      toc,
      wrappedToc,
    },
  });
};

export default transform;
