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
    return `<div class="quizmd-multiple-choice-mmchoice">${this.rendererParams["content"]}`;
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
    return `<div class="quizmd-multiple-choice-mchoice">${this.rendererParams["content"]}<ol type="A">`;
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
    return `<li class="quizmd-multiple-choice-alternative">${this.rendererParams["content"]}`;
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
