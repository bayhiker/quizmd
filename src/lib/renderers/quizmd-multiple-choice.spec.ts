import { RendererParams } from "./quizmd-renderer";
import { QuizMdParser } from "../parser";

import { renderers as mchoiceRenderers } from "./quizmd-multiple-choice";

const allRenderers = QuizMdParser.getAllRenderers();
const renderIt = (name: string, rendererParams: RendererParams) => {
  return new mchoiceRenderers[name](allRenderers, rendererParams).render();
};

describe("quizmd-plugin-multiple-choice", () => {
  test("alternative", () => {
    const html = renderIt("alternative", { content: "Alternative A" });
    expect(html).toEqual(
      `<li class="quizmd-multiple-choice-alternative">Alternative A</li>`
    );
  });

  test("mchoice", () => {
    const html = renderIt("mchoice", { content: "Multiple Choice" });
    expect(html).toEqual(
      `<div class="quizmd-multiple-choice-mchoice">Multiple Choice<ol type="A"></ol></div>`
    );
  });

  test("mmchoice", () => {
    const html = renderIt("mmchoice", {
      content: "Multiple Multiple Choice",
    });
    expect(html).toEqual(
      `<div class="quizmd-multiple-choice-mmchoice">Multiple Multiple Choice</div>`
    );
  });
});
