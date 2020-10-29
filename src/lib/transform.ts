import {anchor, getUrlHash} from '@technote-space/anchor-markdown-header';
import updateSection from 'update-section';
import * as md from '@textlint/markdown-to-ast';
import {TxtNode} from '@textlint/ast-node-types';
import {getHtmlHeaders} from './get-html-headers';
import {
  OPENING_COMMENT,
  CLOSING_COMMENT,
  CHECK_OPENING_COMMENT,
  CHECK_CLOSING_COMMENT,
  DEFAULT_TITLE,
} from '..';
import {TransformOptions, Header, HeaderWithRepetition, HeaderWithAnchor, SectionInfo, TransformResult} from '../types';

const getTargetComments = (checkComments: Array<string>, defaultComments: string): Array<string> => {
  if (checkComments.length) {
    return checkComments;
  }

  return [defaultComments];
};

export const matchesStart = (checkOpeningComments?: Array<string>) => (line: string): boolean => getTargetComments(checkOpeningComments ?? [], CHECK_OPENING_COMMENT).some(comment => new RegExp(comment).test(line));
export const matchesEnd   = (checkClosingComments?: Array<string>) => (line: string): boolean => getTargetComments(checkClosingComments ?? [], CHECK_CLOSING_COMMENT).some(comment => new RegExp(comment).test(line));
const addAnchor           = (mode: string | undefined, moduleName: string | undefined, header: HeaderWithRepetition): HeaderWithAnchor => {
  return {
    ...header,
    anchor: anchor(header.name, mode, header.repetition, moduleName),
  };
};

// eslint-disable-next-line no-magic-numbers
const shouldEscape = (header: TxtNode): boolean => /^#+\s+/.test(header.raw) && !/\s+#+$/.test(header.raw) && header.children.length === 1 && header.children[0].type === md.Syntax.Str;
const escapeHeader = (header: TxtNode): TxtNode => md.parse(header.raw.replace(/^#+\s+/, '').replace('&#035;', '#').replace('#', '&#035;').replace(']', '&#93;').replace('[', '&#91;'));

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

export const getTitle = (title: string | undefined, lines: Array<string>, info: SectionInfo): string => {
  if (title) {
    return title;
  }

  // eslint-disable-next-line no-magic-numbers
  return info.hasStart ? lines[info.startIdx + 2] : DEFAULT_TITLE;
};

const wrapTitle = (title: string, isFolding: boolean | undefined): string => isFolding && title !== '' ? `<summary>${title.replace(/^([*_]*)(.+)\1$/, '$2')}</summary>` : title;
const wrapToc   = (toc: string, title: string, isFolding: boolean | undefined): string => isFolding && title !== '' ? `<details>\n${toc}\n</details>` : toc;

// Use document context as well as command line args to infer the title
const determineTitle = (title: string | undefined, isNotitle: boolean | undefined, isFolding: boolean | undefined, lines: Array<string>, info: SectionInfo): string => {
  if (isNotitle) {
    return '';
  }

  return wrapTitle(getTitle(title, lines, info), isFolding);
};

export const transform = (
  content: string,
  {
    mode,
    moduleName,
    maxHeaderLevel,
    title,
    isNotitle,
    isFolding,
    entryPrefix,
    processAll,
    updateOnly,
    openingComment,
    closingComment,
    checkOpeningComments,
    checkClosingComments,
  }: TransformOptions = {},
): TransformResult => {
  mode        = mode || 'github.com';
  entryPrefix = entryPrefix || '-';

  // only limit *HTML* headings by default
  // eslint-disable-next-line no-magic-numbers
  const maxHeaderLevelHtml = maxHeaderLevel || 4;
  const lines              = content.split('\n');
  const info: SectionInfo  = updateSection.parse(lines, matchesStart(checkOpeningComments), matchesEnd(checkClosingComments));

  if (!info.hasStart && updateOnly) {
    return {
      transformed: false,
      data: '',
      toc: '',
      wrappedToc: '',
      reason: 'update only',
    };
  }

  const inferredTitle  = determineTitle(title, isNotitle, isFolding, lines, info);
  const titleSeparator = inferredTitle ? '\n\n' : '\n';
  // eslint-disable-next-line no-magic-numbers
  const currentToc     = info.hasStart && lines.slice(info.startIdx, info.endIdx + 1).join('\n');
  const linesToToc     = getLinesToToc(lines, currentToc, info, processAll);
  const headers        = getMarkdownHeaders(linesToToc, maxHeaderLevel).concat(getHtmlHeaders(linesToToc, maxHeaderLevelHtml));
  headers.sort((header1, header2) => header1.line - header2.line);

  const allHeaders    = countHeaders(headers, mode, moduleName);
  const lowestRank    = Math.min(...allHeaders.map(header => header.rank));
  const linkedHeaders = allHeaders.map(header => addAnchor(mode, moduleName, header));

  if (!linkedHeaders.length) {
    return {
      transformed: false,
      data: '',
      toc: '',
      wrappedToc: '',
      reason: 'no headers',
    };
  }

  // 4 spaces required for proper indention on Bitbucket and GitLab
  const indentation = (mode === 'bitbucket.org' || mode === 'gitlab.com') ? '    ' : '  ';
  const toc         =
          inferredTitle +
          titleSeparator +
          linkedHeaders.map(header => indentation.repeat(header.rank - lowestRank) + entryPrefix + ' ' + header.anchor).join('\n') +
          '\n';
  const wrappedToc  = (openingComment ?? OPENING_COMMENT) + '\n' + wrapToc(toc, inferredTitle, isFolding) + '\n' + (closingComment ?? CLOSING_COMMENT);
  if (currentToc === wrappedToc) {
    return {
      transformed: false,
      data: '',
      toc: '',
      wrappedToc: '',
      reason: 'not updated',
    };
  }

  return {
    transformed: true,
    data: updateSection(lines.join('\n'), wrappedToc, matchesStart(checkOpeningComments), matchesEnd(checkClosingComments), true),
    toc,
    wrappedToc,
    reason: '',
  };
};

export default transform;
