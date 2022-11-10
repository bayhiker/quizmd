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
    this.name = "mmchoice";
    this.descShort = "mmchoice";
    this.descLong = "Create a problem with a few multiple-choice questions";
    this.sample = [
      "mmchoice :- Overall problem statement", // use ${0:text} to move cursor to $0 location in an editor
      "  mchoice :- Question statement<br>",
      "    alternative:- text",
      "    solution:- text",
    ];
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
    this.name = "mchoice";
    this.cssStyle =
      "display:flex;flex-direction:row;justify-content:flex-start;white-space:nowrap";
    this.descShort = "mchoice";
    this.descLong = "Create a multiple-choice question";
    this.sample = [
      "mchoice :- Question content",
      "  alternative:- text",
      "  solution:- text",
    ];
  }

  renderOpening(): string {
    let content = this.rendererParams["content"] || "";
    return `<div style="display:block">${parseKatex([
      "" + content,
    ])}<ol type="A"${this.getGlobalAttrs()}>`;
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
    this.name = "alternative";
    this.cssStyle = "padding:5px 100px 5px 10px";
    this.descShort = "alternative";
    this.descLong = "Create an alternative";
    this.sample = ["alternative:- alternative content"];
  }

  renderOpening(): string {
    // alternative :- content
    // or
    // alternative:
    //     content line 1
    //     content line 2
    return `<li${this.getGlobalAttrs()}>${parseKatex([
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
    this.name = "solution";
    if (this.parserOptions["isSolution"]) {
      this.cssStyle = "padding: 5px 100px 5px 10px;color:red;font-weight:bold;";
    }
    this.descShort = "solution";
    this.descLong = "Create a solution alternative";
    this.sample = [`solution:- solution content`];
  }
}

export const renderers: QuizMdRenderers = {
  alternative: AlternativeRenderer,
  solution: SolutionRenderer,
  mchoice: MChoiceRenderer,
  mmchoice: MMChoiceRenderer,
};
