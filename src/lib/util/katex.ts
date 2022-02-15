import katex from "katex";
/**
 * Parse katex statements embedded in strings
 * Embedded katex:
 *   abc $\frac{a}{b}$ something else
 * Or block katex
 * $$
 * katex statement 1
 * katex statement 2
 * $$
 *
 * @param s k=v pairs
 * @returns
 */
function processKatex(lines: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    // Replace katex expressions between $ signs, unless $ is prefixed by \\
    const katexFenceLinePattern = /^\s*\$\$\s*$/;
    if (lines[i].match(/^\s*%%\{.*?\}%%\s*$/)) {
      //ignore directive lines such as %%{config: k1=v1 k2=v1}
      result.push(lines[i]);
    } else if (lines[i].match(katexFenceLinePattern)) {
      //Start of a block katex
      let katexExp = "";
      while (
        i + 1 < lines.length &&
        !lines[i + 1].match(katexFenceLinePattern)
      ) {
        i += 1;
        katexExp += lines[i];
      }
      result.push(katex.renderToString(katexExp));
    } else {
      let currentLine = lines[i];
      // Not a block katex expression like $$\n xxxxx \n$$\n, look for inline katex expression
      const katexEmbeddedPattern = /(?<!\\)\$(.*?)(?<!\\)\$/;
      let match = lines[i].match(katexEmbeddedPattern);
      while (match) {
        let katexExp = match[1];
        currentLine = currentLine.replace(
          `$${katexExp}$`,
          katex.renderToString(katexExp)
        );
        match = currentLine.match(katexEmbeddedPattern);
      }
      result.push(currentLine);
    }
  }
  return result;
}

export default processKatex;
