import {Stats} from 'fs';

export type TransformOptions = Partial<{
  mode: string;
  moduleName: string;
  maxHeaderLevel: number;
  title: string;
  isNotitle: boolean;
  isFolding: boolean;
  entryPrefix: string;
  processAll: boolean;
  updateOnly: boolean;
  openingComment: string;
  closingComment: string;
  checkOpeningComments: Array<string>;
  checkClosingComments: Array<string>;
  isCustomMode: boolean;
  customTemplate: string;
  itemTemplate: string;
  separator: string;
  footer: string;
}>;

export type FileInfo = {
  stat: Stats,
  name: string;
  path: string;
};

export type FileAndDirs = {
  directories: Array<FileInfo>;
  markdownFiles: Array<FileInfo>;
};

export type HeaderData = {
  text: Array<string>;
  tag: string;
};

export type Header = {
  line: number;
  name: string;
  rank: number;
};

export type HeaderWithRepetition = Header & {
  repetition: number;
};

export type HeaderWithAnchor = HeaderWithRepetition & {
  anchor: string;
  hash: string;
};

export type SectionInfo = {
  hasStart: boolean;
  hasEnd: boolean;
  startIdx: number;
  endIdx: number;
};

export type TransformResult = {
  transformed: boolean;
  data: string;
  toc: string;
  wrappedToc: string;
  reason: string;
};
