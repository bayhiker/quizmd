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
    options: QuizMdParserOptions = {}
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
    const processedChildLines = processLines(
      this.childLines,
      this.options,
      (
        entityName: string,
        entityConfig: RendererParams,
        entityLine: string,
        entityChildLines: string[]
      ): string[] => {
        if (entityName === "") {
          return [];
        }
        const RendererClass = this.allRenderers[entityName];
        if (!RendererClass) {
          console.warn(`No renderer class found for !${entityName}!`);
          return [];
        } else {
          console.debug(
            `Rendering ${entityName} with config ${JSON.stringify(
              entityConfig
            )}`
          );
          const renderer = new RendererClass(
            this.allRenderers,
            entityConfig,
            entityChildLines,
            this.options
          );
          return [renderer.render()];
        }
      }
    );
    return `${this.renderOpening()}${processedChildLines}${this.renderClosing()}`;
  }

  /**
   * @returns Returns end tags
   */
  renderClosing(): string {
    return "";
  }
}

// A special renderer for root quizmd lines
class QuizMdRootRenderer extends QuizMdRenderer {
  constructor(allRenderers: QuizMdRenderers, childLines: string[] = []) {
    super(allRenderers, {}, childLines);
  }

  renderOpening(): string {
    return "";
  }
}

function processMultiLine(lines: string[]): string[] {
  if (!lines || lines.length < 1) {
    return [];
  }
  const processedLines: string[] = [];
  let i = 0;
  while (i < lines.length) {
    let currentLine = lines[i];
    while (i < lines.length && lines[i].endsWith("\\")) {
      i++;
      // Do NOT trim currentLine, leading spaces are used to identify new entities
      currentLine = `${currentLine.replace(/\\+$/, "")}${lines[i].trim()}`;
    }
    processedLines.push(currentLine);
    i++;
  }
  return processedLines;
}

/**
 * Generic method to process quizmd lines
 *
 * @param lines: QuizMD lines to process
 * @param handleEntity: Callback method with actual processing logic.
 *                      Callback input param is a dict of data the callback understands,
 * @returns Processed lines
 */
function processLines(
  lines: string[],
  parserOptions: QuizMdParserOptions,
  entityHandler: (
    entityName: string,
    entityConfig: RendererParams,
    entityLine: string,
    entityChildLines: string[]
  ) => string[]
) {
  if (!lines || lines.length == 0) {
    return [];
  }
  const processedLines: string[] = [];
  let currentEntityName = "";
  let currentEntityConfig: RendererParams = {};
  let currentEntityChildLines: string[] = [];

  let i = 0;
  // Keep all directive lines as is
  while (lines[i].match(/^\s*%%\{.*?\}%%\s*$/)) {
    //ignore leading directive lines such as %%{config: k1=v1 k2=v1}
    processedLines.push(lines[i]);
    i++;
  }

  let entityLine: string = lines[i];
  const entityIndentation = getIndentation(lines[i]);
  while (i < lines.length) {
    const currentLine = lines[i];
    const currentIndentation = getIndentation(currentLine);
    if (currentIndentation > entityIndentation) {
      currentEntityChildLines.push(currentLine);
    } else {
      if (currentEntityName !== "") {
        // The entity in currentLine is not the first entity, render previous entity
        // before starting a new one
        processedLines.push(
          ...entityHandler(
            currentEntityName,
            currentEntityConfig,
            entityLine,
            currentEntityChildLines
          )
        );
        currentEntityConfig = {};
        currentEntityChildLines = [];
        entityLine = currentLine;
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
    processedLines.push(
      ...entityHandler(
        currentEntityName,
        currentEntityConfig,
        entityLine,
        currentEntityChildLines
      )
    );
  }
  return processedLines;
}

export function parse(
  renderers: QuizMdRenderers,
  lines: string[],
  variables: QuizMdVariables = {},
  options: QuizMdParserOptions = {}
): string {
  if (!lines || lines.length == 0) {
    return "";
  }

  const mergedLines = processMultiLine(lines);
  const translatedLines = processVariables(mergedLines, variables, options);
  const katexLines = processKatex(translatedLines);
  // TODO Process variables
  const rootRenderer = new QuizMdRootRenderer(renderers, katexLines);
  return rootRenderer.render();
}

function getIndentation(s: string): number {
  if (!s || !s.startsWith(" ")) return 0;
  return s.substring(0, s.search(/[^\s]/)).length;
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
  return processLines(
    lines,
    parserOptions,
    (
      entityName: string,
      entityConfig: RendererParams,
      entityLine: string,
      entityChildLines: string[]
    ): string[] => {
      const translatedLines = [];
      // Process variables in entityLine
      const quizmdVarPattern = /(?<!\\){{([a-z\d\.\-\s]+?)(?<!\\)}}/i;
      let match = entityLine.match(quizmdVarPattern);
      while (match) {
        const varDefaultValue = match[1];
        entityLine = entityLine.replace(
          `{{${varDefaultValue}}}`,
          getVariableValue(variables, varDefaultValue, parserOptions)
        );
        match = entityLine.match(quizmdVarPattern);
      }
      return [
        entityLine,
        ...processVariables(entityChildLines, { ...variables }, parserOptions),
      ];
    }
  );
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
