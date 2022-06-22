import type { SectionInfo, TransformOptions } from '../types.js';

const getBoolValue = (input: string): boolean => !['false', '0', '', 'no', 'n'].includes(input.trim().toLowerCase());
const converter    = {
  maxHeaderLevel: (value: string): number => Number(value),
  isNotitle: (value: string): boolean => getBoolValue(value),
  isFolding: (value: string): boolean => getBoolValue(value),
  processAll: (value: string): boolean => getBoolValue(value),
  updateOnly: (value: string): boolean => getBoolValue(value),
  isCustomMode: (value: string): boolean => getBoolValue(value),
  mode: (value: string): string => String(value),
  moduleName: (value: string): string => String(value),
  title: (value: string): string => String(value),
  entryPrefix: (value: string): string => String(value),
  customTemplate: (value: string): string => String(value),
  itemTemplate: (value: string): string => String(value),
  separator: (value: string): string => String(value),
  footer: (value: string): string => String(value),
};

export const getStartSection = (lines: Array<string>, info: SectionInfo, matchesEnd: (line: string) => boolean): Array<string> => {
  if (!info.hasStart) {
    return [];
  }

  // eslint-disable-next-line no-magic-numbers
  for (let index = info.startIdx + 1; index < info.endIdx; ++index) {
    if (!/-->$/.test(lines[index]!.trim())) {
      return lines.slice(info.startIdx, index);
    }
  }

  // consider empty toc with params
  if (info.endIdx < lines.length && matchesEnd(lines[info.endIdx]!)) {
    return lines.slice(info.startIdx, info.endIdx);
  }

  return [lines[info.startIdx]!];
};

export const extractParams = (section: string): TransformOptions => Object.assign({}, ...(section.match(/\s+param::(\w+)::(.*?)::/g)?.map(
  target => target.match(/param::(\w+)::(.*?)::/),
).filter(
  (items): items is Array<string> => items !== null && items[1]! in converter,
).map(
  items => ({ [items[1]!]: converter[items[1]!](items[2]) }),
) ?? []));

export const getParamsSection = (options: TransformOptions): string => {
  if (!Object.keys(options).length) {
    return '';
  }

  return '\n' + Object.entries(options).map(([key, value]) => `<!-- param::${key}::${value}:: -->`).join('\n');
};
