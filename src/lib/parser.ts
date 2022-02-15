import {
  QuizMdRenderer,
  QuizMdRenderers,
  RendererParams,
} from "./renderers/quizmd-renderer";
import { kvparse } from "./util/kvparser";
import { renderers as geometryRenderers } from "./renderers/quizmd-geometry";
import { renderers as multipleChoiceRenderers } from "./renderers/quizmd-multiple-choice";

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
      element.innerHTML = QuizMdRenderer.parseLines(
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

export { QuizMdDirectives, QuizMdParser };
