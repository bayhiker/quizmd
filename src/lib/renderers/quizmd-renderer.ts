import processKatex from "../util/katex";
import { kvparse } from "../util/kvparser";
import { QuizMdVariable, QuizMdVariables } from "./quizmd-variable";

export type RendererParams = { [key: string]: unknown };
export type QuizMdRenderers = { [name: string]: typeof QuizMdRenderer };
export type QuizMdParserOptions = { [name: string]: any };

// QuizMdRenderer must not be abstract or interface for dynamic instance creation to work
// when rendering
export class QuizMdRenderer {
  /**
   * <key, value> dictionary of configuration information which
   * will be parsed by various concrete renderers.
   */
  allRenderers: QuizMdRenderers = {};
  rendererParams: RendererParams;
  childLines: string[];
  variables: QuizMdVariables = {};
  options: QuizMdParserOptions = {};

  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = [],
    variables: QuizMdVariables = {},
    options = {}
  ) {
    this.allRenderers = allRenderers;
    this.rendererParams = rendererParams;
    this.childLines = childLines;
    this.variables = variables;
    this.options = options;
  }

  /**
   * Renders current QuizMd entity
   *
   * @returns HTML snippet for current entity
   */
  renderOpening(): string {
    throw new Error("Renderer must define renderOpening() method");
  }

  render(): string {
    return `${this.renderOpening()}${parseLines(
      this.allRenderers,
      this.childLines,
      this.variables,
      this.options
    )}${this.renderClosing()}`;
  }

  /**
   * @returns Returns end tags
   */
  renderClosing(): string {
    return "";
  }
}

export function parseLines(
  renderers: QuizMdRenderers,
  lines: string[],
  variables: QuizMdVariables = {},
  options: QuizMdParserOptions = {}
): string {
  if (!lines || lines.length == 0) {
    return "";
  }

  let parsedText = "";

  let currentEntityName = "";
  let currentEntityConfig: RendererParams = {};
  let currentEntityChildLines: string[] = [];

  //parseKatex
  const katexLines = processKatex(lines);

  let i = 0;
  // Skip all directive lines
  while (katexLines[i].match(/^\s*%%\{.*?\}%%\s*$/)) {
    //ignore directive lines such as %%{config: k1=v1 k2=v1}
    i++;
  }

  const entityIndentation = getIndentation(katexLines[i]);
  while (i < katexLines.length) {
    let currentLine: string = katexLines[i];
    const currentIndentation = getIndentation(currentLine);
    // Do NOT trim currentLine, leading spaces are used to identify new entities
    while (i < katexLines.length && katexLines[i].endsWith("\\")) {
      i++;
      currentLine = `${currentLine.replace(/\\+$/, "")} ${katexLines[
        i
      ].trim()}`;
    }
    if (currentIndentation > entityIndentation) {
      currentEntityChildLines.push(currentLine);
    } else {
      if (currentEntityName !== "") {
        // The entity in currentLine is not the first entity, render previous entity
        // before starting a new one
        parsedText += renderCurrentEntity(
          renderers,
          currentEntityName,
          currentEntityConfig,
          currentEntityChildLines,
          { ...variables }, // Shallow copy variables to allow local variable stack for each entity
          options
        );
        currentEntityConfig = {};
        currentEntityChildLines = [];
      }
      // This is the start of a new entity
      if (currentLine.search(/^\s*?[^\s]*?\s*?:-/) >= 0) {
        // renderer-name:- some-content, shortcut for renderer-name: content="text-till-end-of-line"
        const index = currentLine.search(/:-/);
        currentEntityName = currentLine.substring(0, index).trim();
        currentEntityConfig = { content: currentLine.substring(index + 2) };
      } else if (currentLine.search(/^\s*?[^\s]*?\s*?:/) >= 0) {
        // renderer-name: k-v pairs
        const index = currentLine.search(/:/);
        currentEntityName = currentLine.substring(0, index).trim();
        currentEntityConfig = kvparse(currentLine.substring(index + 2)) || {};
      } else {
        // No :- or :, then the whole line must be a renderer name
        currentEntityName = currentLine;
      }
    }
    i++;
  }
  // Render last entity if it's not empty
  if (currentEntityName !== "") {
    parsedText += renderCurrentEntity(
      renderers,
      currentEntityName,
      currentEntityConfig,
      currentEntityChildLines,
      { ...variables }, // shallow copy to allow local variables stack
      options
    );
  }
  return parsedText;
}

function renderCurrentEntity(
  renderers: QuizMdRenderers,
  currentEntityName: string,
  currentEntityConfig: RendererParams,
  currentEntityChildLines: string[],
  variables: QuizMdVariables = {},
  options: QuizMdParserOptions = {}
): string {
  if (currentEntityName === "") {
    return "";
  }
  if (currentEntityConfig["content"]) {
    // Process variables in content section
    let content: string = currentEntityConfig["content"] as string;
    const quizmdVarPattern = /(?<!\\){{(.*?)(?<!\\)}}/;
    let match = content.match(quizmdVarPattern);
    while (match) {
      const varDefaultValue = match[1];
      content = content.replace(
        `{{${varDefaultValue}}}`,
        getVariableValue(variables, varDefaultValue, options)
      );
      match = content.match(quizmdVarPattern);
    }
    currentEntityConfig["content"] = content;
  }
  const RendererClass = renderers[currentEntityName];
  if (!RendererClass) {
    console.warn(`No renderer class found for !${currentEntityName}!`);
    return "";
  } else {
    console.debug(
      `Rendering ${currentEntityName} with config ${JSON.stringify(
        currentEntityConfig
      )}`
    );
    const renderer = new RendererClass(
      renderers,
      currentEntityConfig,
      currentEntityChildLines,
      variables,
      options
    );
    return renderer.render();
  }
}

function getIndentation(s: string): number {
  if (!s || !s.startsWith(" ")) return 0;
  return s.substring(0, s.search(/[^\s]/)).length;
}

function getVariableValue(
  variables: QuizMdVariables,
  defaultValueString: string,
  options: QuizMdParserOptions
) {
  if (!(defaultValueString in variables)) {
    variables[defaultValueString] = new QuizMdVariable(defaultValueString);
  }
  const variable = variables[defaultValueString];
  if ("randomize" in options && options["randomize"]) {
    return variable.getRandomValue();
  } else {
    return variable.defaultValue;
  }
}
/**
 * Process variables embedded in strings.
 *
 * mchoice:- {{Mary}} has {{3}} lambs. How many lambs does {{Mary}} have?
 *   alternative:-{{Mary}} has {{3}} lambs
 *
 * If randomize option is set to false, this translates to:
 *
 * mchoice:- Mary has 3 lambs. How many lambs does Mary have?
 *   alternative:-Mary has 3 lambs
 *
 * If randomize option is set to true, this could translate to:
 *
 * mchoice:- Nancy has 8 lambs. How many lambs does Alice have?
 *   alternative:-Alice has 8 lambs
 *
 * @param lines: input lines
 * @param variables: variables passed into the current block of lines
 * @param parserOptions: parserOptions, e.g., randomize variables if parserOptions.randomize is set
 * @returns lines with variables translated into values
 */
function processVariables(
  lines: string[],
  variables: QuizMdVariables,
  parserOptions: QuizMdParserOptions
): string[] {
  const result: string[] = [];
  return result;
}
