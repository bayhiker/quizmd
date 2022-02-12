import parseKatex from "../util/katex";
import {
  QuizMdParserOptions,
  QuizMdRenderer,
  QuizMdRenderers,
  RendererParams,
} from "./quizmd-renderer";
import { QuizMdVariables } from "./quizmd-variable";

// One problem statement followed by a few multiple-choice questions
class MMChoiceRenderer extends QuizMdRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = [],
    variables: QuizMdVariables = {},
    options: QuizMdParserOptions = {}
  ) {
    super(allRenderers, rendererParams, childLines, variables, options);
  }

  renderOpening(): string {
    return `<div class="quizmd-multiple-choice-mmchoice">${parseKatex([
      "" + this.rendererParams["content"],
    ])}`;
  }

  renderClosing(): string {
    return "</div>";
  }
}

// One problem statement/question followed by a few alternatives
class MChoiceRenderer extends QuizMdRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = [],
    variables: QuizMdVariables = {},
    options: QuizMdParserOptions = {}
  ) {
    super(allRenderers, rendererParams, childLines, variables, options);
  }

  renderOpening(): string {
    let content = this.rendererParams["content"] || "";
    return `<div class="quizmd-multiple-choice-mchoice">${parseKatex([
      "" + content,
    ])}<ol type="A">`;
  }

  renderClosing(): string {
    return "</ol></div>";
  }
}

class AlternativeRenderer extends QuizMdRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = [],
    variables: QuizMdVariables = {},
    options: QuizMdParserOptions = {}
  ) {
    super(allRenderers, rendererParams, childLines, variables, options);
  }

  renderOpening(): string {
    // alternative :- content
    // or
    // alternative:
    //     content line 1
    //     content line 2
    return `<li class="quizmd-multiple-choice-alternative">${parseKatex([
      "" + this.rendererParams["content"],
    ])}`;
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
