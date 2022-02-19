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
    //NOT setting shuffleChildren, different questions under this mmchoice
    //may need to be related and need to be sequential
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
    //Shuffle alternatives if randomize flag is also set in QuizMdParserOptions
    this.shuffleChildren = true;
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
  className: string = "quizmd-multiple-choice-alternative";
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
    return `<li class="${this.className}">${parseKatex([
      "" + this.rendererParams["content"],
    ])}`;
  }

  renderClosing(): string {
    return "</li>";
  }
}

class SolutionRenderer extends AlternativeRenderer {
  className: string = "quizmd-multiple-choice-alternative";
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = [],
    variables: QuizMdVariables = {},
    options: QuizMdParserOptions = {}
  ) {
    super(allRenderers, rendererParams, childLines, variables, options);
    this.className = "quizmd-multiple-choice-solution";
  }
}

export const renderers: QuizMdRenderers = {
  alternative: AlternativeRenderer,
  solution: SolutionRenderer,
  mchoice: MChoiceRenderer,
  mmchoice: MMChoiceRenderer,
};
