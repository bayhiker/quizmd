/**
 * Parse key value pairs. Sample inputs:
 * k1=v1 k2=v2
 * k1\=k1=v1 k2=v2
 * "k 1" = "v 1" k2=v2
 * "k1\"" = "v1"
 * 'k"1' = 'v1'
 * "k'1" = 'v1'
 * k1=v1 flag1 k2=v2
 *
 * @param s k=v pairs
 * @returns
 */
function kvparse(s: string): { [key: string]: unknown } {
  const result: { [key: string]: unknown } = {};

  let remainder = s,
    prevWord = '',
    currWord = '',
    waitingForValue = false;
  while (remainder && remainder.length > 0) {
    [currWord, remainder] = findNextWord(remainder);
    if (currWord === '=') {
      if (prevWord === '') {
        console.warn(`Syntax error around ${currWord} before ${remainder}`);
      } else {
        waitingForValue = true;
      }
    } else {
      // It is a key or value or a flag
      if (waitingForValue) {
        result[prevWord] = currWord;
        waitingForValue = false;
        prevWord = '';
      } else {
        if (prevWord !== '') {
          result[prevWord] = true;
          prevWord = '';
        }
        prevWord = currWord;
      }
    }
  }
  if (prevWord !== '') {
    // Last item is a flag, add it to result
    result[prevWord] = true;
  }
  return result;
}

function findNextWord(s: string): string[] {
  let word = '';
  let remainder = '';
  s = s.trim();
  if (s.startsWith('=')) {
    word = '=';
    remainder = s.substring(1);
  } else if (s.startsWith('"')) {
    const match = s.match(/^"(.*?[^\\])".*$/);
    if (match) {
      word = match[1];
      remainder = s.substring(word.length + 2);
      word = word.replace(/\\"/g, '"');
    }
  } else if (s.startsWith("'")) {
    const match = s.match(/^'(.*?[^\\])'.*$/);
    if (match) {
      word = match[1];
      remainder = s.substring(word.length + 2);
      word = word.replace(/\\"/g, '"');
    }
  } else {
    // Look for the first word separator:space or ' or " or =, with no leading backslash
    const match = s.match(/^(.*?[^\\])($|([ '"=].*$))/);
    if (match) {
      word = match[1];
      remainder = s.substring(word.length);
    }
  }
  if (word === '') {
    throw new Error(`Wrong k-v string format for substring ${s}`);
  }

  word = word.replace(/\\"/g, '"');
  word = word.replace(/\\'/g, "'");
  word = word.replace(/\\=/g, '=');
  word = word.replace(/\\ /g, ' ');
  return [word, remainder];
}

export default kvparse;
