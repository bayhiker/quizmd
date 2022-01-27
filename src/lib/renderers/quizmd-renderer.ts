import parseKatex from "../util/katex";
import kvparse from "../util/kvparser";

export type RendererParams = { [key: string]: unknown };
export type QuizMdRenderers = { [name: string]: typeof QuizMdRenderer };

// QuizMdRenderer must not be abstract or interface for dynamic instance creation to work
// when rendering
export class QuizMdRenderer {
  /**
   * <key, value> dictionary of configuration information which
   * will be parsed by various concrete renderers.
   */
  allRenderers: QuizMdRenderers = {};
  rendererParams: RendererParams;
  contentLines: string[];

  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    this.allRenderers = allRenderers;
    this.rendererParams = rendererParams;
    this.contentLines = contentLines;
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
    return `${this.renderOpening()}${QuizMdRenderer.parseContent(
      this.allRenderers,
      this.contentLines
    )}${this.renderClosing()}`;
  }

  /**
   * @returns Returns end tags
   */
  renderClosing(): string {
    return "";
  }

  static getIndentation(s: string): number {
    if (!s || !s.startsWith(" ")) return 0;
    return s.substring(0, s.search(/[^\s]/)).length;
  }

  static parseContent(renderers: QuizMdRenderers, lines: string[]): string {
    if (!lines || lines.length == 0) {
      return "";
    }

    let parsedText = "";

    let currentEntityName = "";
    let currentEntityConfig: RendererParams = {};
    let currentEntityContent: string[] = [];

    //parseKatex
    lines = parseKatex(lines);

    let i = 0;
    // Skip all directive lines
    while (lines[i].match(/^\s*%%\{.*?\}%%\s*$/)) {
      //ignore directive lines such as %%{config: k1=v1 k2=v1}
      i++;
    }

    const entityIndentation = this.getIndentation(lines[i]);
    while (i < lines.length) {
      let currentLine: string = lines[i];
      const currentIndentation = this.getIndentation(currentLine);
      currentLine = currentLine.trim();
      while (i < lines.length && lines[i].endsWith("\\")) {
        i++;
        currentLine = `${currentLine.replace(/\\+$/, "")} ${lines[i].trim()}`;
      }
      if (currentIndentation > entityIndentation) {
        currentEntityContent.push(currentLine);
      } else {
        if (currentEntityName !== "") {
          // The entity in currentLine is not the first entity, render previous entity
          // before starting a new one
          parsedText += this.renderCurrentEntity(
            renderers,
            currentEntityName,
            currentEntityConfig,
            currentEntityContent
          );
          currentEntityContent = [];
        }
        // This is the start of a new entity
        if (currentLine.search(/^[^\s]*?:-/) >= 0) {
          // renderer-name:- some-content, shortcut for renderer-name: content="text-till-end-of-line"
          const index = currentLine.search(/:-/);
          currentEntityName = currentLine.substring(0, index);
          currentEntityConfig = { content: currentLine.substring(index + 2) };
        } else if (currentLine.search(/^[^\s]*?:/) >= 0) {
          // renderer-name: k-v pairs
          const index = currentLine.search(/:/);
          currentEntityName = currentLine.substring(0, index);
          currentEntityConfig = kvparse(currentLine.substring(index + 2));
        } else {
          // No :- or :, then the whole line must be a renderer name
          currentEntityName = currentLine;
        }
      }
      i++;
    }
    // Render last entity if it's not empty
    if (currentEntityName !== "") {
      parsedText += this.renderCurrentEntity(
        renderers,
        currentEntityName,
        currentEntityConfig,
        currentEntityContent
      );
    }
    return parsedText;
  }

  static renderCurrentEntity(
    renderers: QuizMdRenderers,
    currentEntityName: string,
    currentEntityConfig: RendererParams,
    currentEntityContent: string[]
  ): string {
    if (currentEntityName === "") {
      return "";
    }
    const RendererClass = renderers[currentEntityName];
    if (!RendererClass) {
      console.warn(`No renderer class found for !${currentEntityName}!`);
      return "";
    } else {
      console.log(
        `rendering ${currentEntityName} with config ${JSON.stringify(
          currentEntityConfig
        )}`
      );
      const renderer = new RendererClass(
        renderers,
        currentEntityConfig,
        currentEntityContent
      );
      return renderer.render();
    }
  }
}
