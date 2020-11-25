export const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getRegExp = (value: string): RegExp => new RegExp(escapeRegExp(value));

export const replaceAll = (string: string, key: string | RegExp, value: string): string => string.split(key).join(value);

export const replaceVariables = (string: string, variables: { key: string; replace: string }[]): string => {
  let replaced = string;
  for (const variable of variables) {
    if (getRegExp(`\${${variable.key}}`).test(replaced)) {
      replaced = replaceAll(replaced, `\${${variable.key}}`, variable.replace);
    }
  }

  return replaced;
};
