/**
 * Interprets markdown-like quizmd syntax to understood by browsers: html/svg/css etc
 */
import { QuizMdVariables } from "./lib/renderers/quizmd-variable";
import { kvparse } from "./lib/util/kvparser";
import {
  parse,
  QuizMdRenderers,
  QuizMdParserOptions,
} from "./lib/renderers/quizmd-renderer";
import { renderers as geometryRenderers } from "./lib/renderers/quizmd-geometry";
import { renderers as multipleChoiceRenderers } from "./lib/renderers/quizmd-multiple-choice";

type ParserCallback = (id: string) => void;
type QuizMdConfig = { [key: string]: unknown };

class QuizMdDirectives {
  text = "";

  constructor(text: string) {
    this.text = text;
  }

  getConfig(): QuizMdConfig {
    let config: QuizMdConfig = {};
    const configMatch = this.text.match(/%%\{config:(.*?)\}%%/m);
    if (configMatch && configMatch.length > 1) {
      config = kvparse(`{${configMatch[1]}}`);
    }
    return config;
  }
}

class QuizMdParser {
  config: QuizMdConfig = { processedFlagAttrName: "quizmd-processed" };
  allRenderers: QuizMdRenderers;

  constructor(config: QuizMdConfig) {
    this.allRenderers = QuizMdParser.getAllRenderers();
    for (const key in config) {
      this.config[key] = config[key];
    }
  }

  parseNode(element: Element, callback?: ParserCallback) {
    const elementText = new DOMParser()
      .parseFromString(element.innerHTML, "text/html")
      .documentElement.textContent?.trim() as string;
    const quizMdDirectives = new QuizMdDirectives(elementText);
    const mergedConfig = this.config;
    const additionalConfig = quizMdDirectives.getConfig();
    for (const key in additionalConfig) {
      mergedConfig[key] = additionalConfig[key];
    }

    const processedFlag = this.config["processedFlagAttrName"] as string;
    if (element.getAttribute(processedFlag)) {
      return;
    }
    element.setAttribute(processedFlag, "true");

    const id = `quizmd-${Math.random().toString(36).substr(2, 9)}}`;

    try {
      element.innerHTML = parse(
        this.allRenderers,
        elementText.split(/[\r\n]+/)
      );
    } catch (e) {
      console.warn(`Error while rendering, ${e}`);
    }
    if (callback) {
      callback(id);
    }
  }

  parseNodeList(nodes: Element[], callback?: ParserCallback) {
    for (let i = 0; i < nodes?.length; i++) {
      this.parseNode(nodes[i], callback);
    }
  }

  /**
   * Goes through an enclosing html element to find quiz definitions and render them.
   *
   * @param nodes - a css selector, e.g. ".quizmd", a node, or an array of nodes
   */
  parseContainer(
    htmlElement: HTMLElement,
    cssSelector = ".quizmd",
    callback?: ParserCallback
  ) {
    this.parseNodeList(
      [].slice.call(htmlElement.querySelectorAll(cssSelector)),
      callback
    );
  }

  static getAllRenderers(): QuizMdRenderers {
    const rendererPlugins = [geometryRenderers, multipleChoiceRenderers];
    const renderers: QuizMdRenderers = {};
    for (let i = 0; i < rendererPlugins.length; i++) {
      const pluginRenderers = rendererPlugins[i];
      const keys = Object.keys(pluginRenderers);
      for (let j = 0; j < keys.length; j++) {
        const name = keys[j];
        renderers[name] = pluginRenderers[name];
      }
    }
    return renderers;
  }
}

/**
 * Goes through src/lib/renderer and "quizmd-plugin-xxx" in package.json
 * to extract all renderers
 */
const init = function (...args: any[]) {
  console.log(`Init() called here`);
  const quizMdParser = new QuizMdParser({});
  let callback: () => void = function () {
    return undefined;
  };
  if (args.length >= 1) {
    if (typeof args[args.length - 1] === "function") {
      callback = args[args.length - 1] as () => void;
    }
    if (typeof args[0] === "string") {
      quizMdParser.parseContainer(document.documentElement, args[0], callback);
    } else if (Array.isArray(args[0])) {
      quizMdParser.parseNodeList(args[0] as Element[], callback);
    } else {
      quizMdParser.parseContainer(
        document.documentElement,
        ".quizmd",
        callback
      );
    }
  } else {
    console.log(`Parsing quizmd divs now....`);
    quizMdParser.parseContainer(document.documentElement, ".quizmd", callback);
  }
};

/**
 * ##contentLoaded
 * Callback function that is called when page is loaded. This functions fetches configuration for mermaid rendering and
 * calls init for rendering the mermaid diagrams on the page.
 */
const contentLoaded = function () {
  if (quizmd.startOnLoad) {
    quizmd.init();
  }
};

if (typeof document !== "undefined") {
  window.addEventListener(
    "load",
    function () {
      contentLoaded();
    },
    false
  );
}

export const quizmd = {
  startOnLoad: true,
  getAllRenderers: QuizMdParser.getAllRenderers,
  parse: (
    content: string[],
    variables: QuizMdVariables = {},
    options: QuizMdParserOptions = {}
  ) => parse(QuizMdParser.getAllRenderers(), content, variables, options),
  init,
  contentLoaded,
};

export { QuizMdDirectives, QuizMdParser };
export { kvparse } from "./lib/util/kvparser";
export { QuizMdVariable } from "./lib/renderers/quizmd-variable";
export type { QuizMdVariables } from "./lib/renderers/quizmd-variable";
export type { QuizMdParserOptions } from "./lib/renderers/quizmd-renderer";
export type { KvPairs } from "./lib/util/kvparser";
