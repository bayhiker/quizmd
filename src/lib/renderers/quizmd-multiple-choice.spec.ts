import { parse, RendererParams } from "./quizmd-renderer";
import { QuizMdParser } from "../..";

import { renderers as mchoiceRenderers } from "./quizmd-multiple-choice";

const allRenderers = QuizMdParser.getAllRenderers();
const renderIt = (name: string, rendererParams: RendererParams) => {
  return new mchoiceRenderers[name](allRenderers, rendererParams).render();
};

describe("quizmd-plugin-multiple-choice", () => {
  test("alternative", () => {
    const html = renderIt("alternative", { content: "Alternative A" });
    expect(html).toMatch(
      /<li class="quizmd-multiple-choice-alternative">[^]*?Alternative A[^]*?<\/li>/
    );
  });

  test("mchoice", () => {
    const html = renderIt("mchoice", { content: "Multiple Choice" });
    expect(html).toMatch(
      /<div class="quizmd-multiple-choice-mchoice">[^]*?Multiple Choice[^]*?<ol type="A"><\/ol><\/div>/
    );
  });

  test("mmchoice", () => {
    const html = renderIt("mmchoice", {
      content: "Multiple Multiple Choice",
    });
    expect(html).toMatch(
      /<div class="quizmd-multiple-choice-mmchoice">[^]*?Multiple Multiple Choice[^]*?<\/div>/
    );
  });

  test("mchoice, render with single line katex expression", () => {
    const html = renderIt("mmchoice", {
      content: "alternative:- $\\frac{a}{b}$",
    });
    expect(html).toMatch(/katex-mathml/);
  });

  test("parseContent, mmchoice with multiple choice and multiple alternatives", () => {
    const s = parse(allRenderers, [
      "mmchoice :- main statement",
      "  mchoice:- problem 1",
      "    alternative:- alternative A",
      "    alternative:- alternative B",
      "  mchoice:- problem 2",
      "    alternative:- alternative C",
      "    alternative:- alternative D",
    ]);
    expect(s).toMatch("alternative");
  });

  test("parseContent, with variable", () => {
    const s = parse(allRenderers, [
      "mchoice :- This has an integer {{300}}, yes",
      "  alternative:- An alternative with float {{1.23}}, lets see.",
    ]);
    expect(s).toMatch(/(?<!\{)300(?!\{)/);
  });

  test("parseContent, with variable random", () => {
    const s = parse(
      allRenderers,
      [
        "mchoice :- This has an integer {{300}}, yes",
        "  alternative:- An alternative with float {{1.23}}, lets see.",
      ],
      {},
      { randomize: true }
    );
    expect(s).toMatch(/(?<!\{)\d+(?!\{)/);
  });
  test("parseContent, with variable inside katex", () => {
    const s = parse(
      allRenderers,
      [
        "mchoice :- This has an integer $\\frac{1}{{{300}}}$, yes",
        "  alternative:- An alternative with float {{1.23}}, lets see.",
      ],
      {},
      { randomize: true }
    );
    expect(s).toMatch(/(?<!\{)\d+(?!\{)/);
  });

  test("parseContent, with variable appearing in multiple places", () => {
    const s = parse(
      allRenderers,
      [
        "mchoice :- This has an integer $\\frac{1}{{{300}}}$, yes",
        "  alternative:- An alternative with variable defined before {{300}}, lets see.",
      ],
      {},
      { randomize: true }
    );
    const match = s.match(/frac\{1\}\{(\d+?)\}.*?defined before (\d+),/);
    expect(match).toBeTruthy();
    expect(match[1]).toEqual(match[2]);
  });

  test("parseContent, with variable appearing three time, twice inside latex", () => {
    const s = parse(
      allRenderers,
      [
        "mchoice :- Problem 1 <br> \\",
        "$\\frac{3 \\times 5}{9 \\times {{11}}} \\times \\frac{7 \\times 9 \\times {{11}}}{3 \\times 5 \\times 7} $",
        "  alternative :- 50",
        "  alternative :- Answer is {{11}}.",
      ],
      {},
      { randomize: true }
    );
    const match = s.match(/Answer is (\d+)\./);
    expect(match).toBeTruthy();
  });

  test("parseContent, with math expression", () => {
    const s = parse(allRenderers, [
      "mchoice :- This has an expression {{1*2*3}}, yes",
    ]);
    const match = s.match(/expression 6,/);
    expect(match).toBeTruthy();
  });

  test("parseContent, with variable expression and variables inside expression", () => {
    const s = parse(allRenderers, [
      "mchoice :- This has a variable expression {{{{1}}*{{2}}*3}}, yes",
    ]);
    const match = s.match(/expression 6,/);
    expect(match).toBeTruthy();
  });

  test("parseContent, with variable expression and variables inside expression, randomized", () => {
    const s = parse(
      allRenderers,
      ["mchoice :- This has a variable expression {{{{1}}*{{2}}*3}}, yes"],
      {},
      { randomize: true }
    );
    const match = s.match(/expression \d+,/);
    expect(match).toBeTruthy();
  });

  test("parseMchoice, verify alternatives are shuffled when randomize is et", () => {
    let match = undefined;
    for (let i = 0; i < 100; i++) {
      const s = parse(
        allRenderers,
        [
          "mchoice :- foo",
          "  alternative:- alternativeA.",
          "  alternative:- alternativeB.",
          "  alternative:- alternativeC.",
        ],
        {},
        { randomize: true }
      );
      match = s.match(/alternativeB.*?alternativeA/);
      if (match) {
        break;
      }
    }
    expect(match).toBeTruthy();
  });
});
