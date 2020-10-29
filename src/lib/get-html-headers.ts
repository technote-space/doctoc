import * as htmlparser from 'htmlparser2';
import * as md from '@textlint/markdown-to-ast';
import {HeaderData, Header} from '../types';

const addLinenos = (lines: Array<string>, headers: Array<HeaderData>): Array<Omit<Header, 'rank'> & HeaderData> => {
  let current = 0;
  return headers.map(header => {
    for (let lineno = current; lineno < lines.length; lineno++) {
      const line = lines[lineno];
      if (new RegExp(header.text[0]).test(line)) {
        current = lineno;
        return {
          ...header,
          line: lineno,
          name: header.text.join(''),
        };
      }
    }

    // in case we didn't find a matching line, which is odd,
    // we'll have to assume it's right on the next line
    return {
      ...header,
      line: ++current,
      name: header.text.join(''),
    };
  });
};

const rankify = (headers: Array<Omit<Header, 'rank'> & HeaderData>, max): Array<Header> => headers.map(header => ({
  ...header,
  // eslint-disable-next-line no-magic-numbers
  rank: parseInt(header.tag.slice(1), 10),
})).filter(header => header.rank <= max);

export const getHtmlHeaders = (lines: Array<string>, maxHeaderLevel: number): Array<Header> => {
  const source = md.parse(lines.join('\n'))
    .children
    .filter(node => node.type === md.Syntax.HtmlBlock || node.type === md.Syntax.Html)
    .map(node => node.raw)
    .join('\n');

  const headers: Array<HeaderData> = [];
  const grabbing: Array<string>    = [];
  const text: Array<string>        = [];

  const parser = new htmlparser.Parser({
    onopentag: name => {
      // Short circuit if we're already inside a pre
      // eslint-disable-next-line no-magic-numbers
      if (grabbing[grabbing.length - 1] === 'pre') {
        return;
      }

      if (name === 'pre' || (/h\d/).test(name)) {
        grabbing.push(name);
      }
    },
    ontext: text_ => {
      // Explicitly skip pre tags, and implicitly skip all others
      // eslint-disable-next-line no-magic-numbers
      if (!grabbing.length || grabbing[grabbing.length - 1] === 'pre') {
        return;
      }

      text.push(text_);
    },
    onclosetag: name => {
      if (!grabbing.length) {
        return;
      }

      // eslint-disable-next-line no-magic-numbers
      if (grabbing[grabbing.length - 1] === name) {
        headers.push({text: [...text], tag: grabbing.pop()!});
        text.length = 0;
      }
    },
  }, {decodeEntities: true});

  parser.write(source);
  parser.end();

  return rankify(addLinenos(lines, headers), maxHeaderLevel);
};
