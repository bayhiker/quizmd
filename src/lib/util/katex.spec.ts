import parseKatex from "./katex";

describe("kvparser", () => {
  test("parseKatex, single line", () => {
    expect(parseKatex(["abc $\\frac{a}{b}$ def"])[0]).toMatch(/katex-mathml/);
  });

  test("parseKatex, block", () => {
    expect(parseKatex(["$$", "\\frac{a}{b}", "$$"])[0]).toMatch(/katex-mathml/);
  });
});
