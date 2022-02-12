import { QuizMdRenderer, RendererParams } from "./quizmd-renderer";
import { QuizMdParser } from "../parser";

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
    const s = QuizMdRenderer.parseLines(allRenderers, [
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
    const s = QuizMdRenderer.parseLines(allRenderers, [
      "mchoice :- This has an integer {{300}}, yes",
      "  alternative:- An alternative with float {{1.23}}, lets see.",
    ]);
    expect(s).toMatch(/(?<!\{)300(?!\{)/);
  });

  test("parseContent, with variable random", () => {
    const s = QuizMdRenderer.parseLines(
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
});
