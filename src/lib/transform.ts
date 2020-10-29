import {anchor} from '@technote-space/anchor-markdown-header';
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

export const matchesStart = (openingComment?: string) => (line: string): boolean => (new RegExp(openingComment ? openingComment : CHECK_OPENING_COMMENT)).test(line);
export const matchesEnd   = (closingComment?: string) => (line: string): boolean => (new RegExp(closingComment ? closingComment : CHECK_CLOSING_COMMENT)).test(line);
const addAnchor    = (mode: string | undefined, header: HeaderWithRepetition): HeaderWithAnchor => {
  return {
    ...header,
    anchor: anchor(header.name, mode, header.repetition),
  };
};

export const getMarkdownHeaders = (lines, maxHeaderLevel): Array<Header> => {
  const extractText = (header: TxtNode): string => {
    return header.children
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

export const countHeaders = (headers: Array<Pick<Header, 'rank' | 'name' | 'line'>>): Array<HeaderWithRepetition> => {
  const repetitions = {};
  return headers.map(header => {
    const name = header.name;
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
    maxHeaderLevel,
    title,
    isNotitle,
    isFolding,
    entryPrefix,
    processAll,
    updateOnly,
    openingComment,
    closingComment,
    checkOpeningComment,
    checkClosingComment,
  }: TransformOptions = {},
): TransformResult => {
  mode        = mode || 'github.com';
  entryPrefix = entryPrefix || '-';

  // only limit *HTML* headings by default
  // eslint-disable-next-line no-magic-numbers
  const maxHeaderLevelHtml = maxHeaderLevel || 4;
  const lines              = content.split('\n');
  const info: SectionInfo  = updateSection.parse(lines, matchesStart(checkOpeningComment), matchesEnd(checkClosingComment));

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

  const allHeaders    = countHeaders(headers);
  const lowestRank    = Math.min(...allHeaders.map(header => header.rank));
  const linkedHeaders = allHeaders.map(header => addAnchor(mode, header));

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
    data: updateSection(lines.join('\n'), wrappedToc, matchesStart(checkOpeningComment), matchesEnd(checkClosingComment), true),
    toc,
    wrappedToc,
    reason: '',
  };
};

export default transform;