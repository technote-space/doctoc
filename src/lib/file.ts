import fs from 'fs';
import path from 'path';
import { MARKDOWN_EXTENSIONS, IGNORED_DIRS } from '..';
import { FileInfo, FileAndDirs } from '../types';

const separateFilesAndDirs = (fileInfos: Array<FileInfo>): FileAndDirs => ({
  directories: fileInfos.filter(info => info.stat.isDirectory() && !IGNORED_DIRS.includes(info.name)),
  markdownFiles: fileInfos.filter(info => info.stat.isFile() && MARKDOWN_EXTENSIONS.includes(path.extname(info.name))),
});

const findRec = (currentPath: string): Array<FileInfo> => {
  const getStat = (entry: string): FileInfo => {
    const target = path.resolve(currentPath, entry);
    const stat   = fs.statSync(target);

    return {
      stat,
      name: entry,
      path: target,
    };
  };

  const process = (fileInfos: Array<FileInfo>): { markdownFiles: Array<FileInfo>; subdirs: Array<string> } => {
    const res  = separateFilesAndDirs(fileInfos);
    const tgts = res.directories.map(info => info.path);

    if (res.markdownFiles.length) {
      console.log('\nFound %s in "%s"', res.markdownFiles.map(info => info.name).join(', '), currentPath);
    } else {
      console.log('\nFound nothing in "%s"', currentPath);
    }

    return {
      markdownFiles: res.markdownFiles,
      subdirs: tgts,
    };
  };

  const stats: Array<FileInfo>                                          = fs.readdirSync(currentPath).map(getStat);
  const res: { markdownFiles: Array<FileInfo>; subdirs: Array<string> } = process(stats);
  const markdownsInSubdirs: Array<Array<FileInfo>>                      = res.subdirs.map(findRec);
  return res.markdownFiles.concat(...markdownsInSubdirs);
};

// Finds all markdown files in given directory and its sub-directories
// @param {String  } dir - the absolute directory to search in
export const findMarkdownFiles = (dir: string): Array<FileInfo> => {
  return findRec(dir);
};

export default findMarkdownFiles;
