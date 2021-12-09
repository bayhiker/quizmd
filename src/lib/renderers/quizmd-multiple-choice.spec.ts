import { RendererParams } from "./quizmd-renderer";
import { QuizMdParser } from "../parser";

import { renderers as mchoiceRenderers } from "./quizmd-multiple-choice";

const allRenderers = QuizMdParser.getAllRenderers();
const renderIt = async (name: string, rendererParams: RendererParams) => {
  return await new mchoiceRenderers[name](
    allRenderers,
    rendererParams
  ).render();
};

describe("quizmd-plugin-multiple-choice", () => {
  test("alternative", async () => {
    const html = await renderIt("alternative", { content: "Alternative A" });
    expect(html).toEqual(
      `<li class="quizmd-multiple-choice-alternative">Alternative A</li>`
    );
  });

  test("mchoice", async () => {
    const html = await renderIt("mchoice", { content: "Multiple Choice" });
    expect(html).toEqual(
      `<div class="quizmd-multiple-choice-mchoice">Multiple Choice<ol type="A"></ol></div>`
    );
  });

  test("mmchoice", async () => {
    const html = await renderIt("mmchoice", {
      content: "Multiple Multiple Choice",
    });
    expect(html).toEqual(
      `<div class="quizmd-multiple-choice-mchoice">Multiple Multiple Choice</div>`
    );
  });
});
