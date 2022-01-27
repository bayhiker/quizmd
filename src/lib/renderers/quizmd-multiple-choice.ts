import parseKatex from "../util/katex";
import {
  QuizMdRenderer,
  QuizMdRenderers,
  RendererParams,
} from "./quizmd-renderer";

class MMChoiceRenderer extends QuizMdRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  renderOpening(): string {
    return `<div class="quizmd-multiple-choice-mmchoice">
    ${parseKatex(["" + this.rendererParams["content"]])}
    ${QuizMdRenderer.parseContent(this.allRenderers, this.contentLines)}`;
  }

  renderClosing(): string {
    return "</div>";
  }
}

class MChoiceRenderer extends QuizMdRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  renderOpening(): string {
    return `<div class="quizmd-multiple-choice-mchoice">
    ${parseKatex(["" + this.rendererParams["content"]])}
    ${QuizMdRenderer.parseContent(
      this.allRenderers,
      this.contentLines
    )}<ol type="A">`;
  }

  renderClosing(): string {
    return "</ol></div>";
  }
}

class AlternativeRenderer extends QuizMdRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  renderOpening(): string {
    // alternative :- content
    // or
    // alternative:
    //     content line 1
    //     content line 2
    return `<li class="quizmd-multiple-choice-alternative"> 
     ${parseKatex(["" + this.rendererParams["content"]])}
     ${QuizMdRenderer.parseContent(this.allRenderers, this.contentLines)}`;
  }

  renderClosing(): string {
    return "</li>";
  }
}

export const renderers: QuizMdRenderers = {
  alternative: AlternativeRenderer,
  mchoice: MChoiceRenderer,
  mmchoice: MMChoiceRenderer,
};
