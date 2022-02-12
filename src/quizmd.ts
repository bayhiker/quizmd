/**
 * Interprets markdown-like quizmd syntax to understood by browsers: html/svg/css etc
 */
import { QuizMdParser } from "./lib/parser";
import {
  QuizMdParserOptions,
  QuizMdRenderer,
} from "./lib/renderers/quizmd-renderer";
import {
  QuizMdVariable,
  QuizMdVariables,
} from "./lib/renderers/quizmd-variable";

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

const quizmd = {
  startOnLoad: true,
  getAllRenderers: QuizMdParser.getAllRenderers,
  parse: (
    content: string[],
    variables: QuizMdVariables = {},
    options: QuizMdParserOptions = {}
  ) =>
    QuizMdRenderer.parseLines(
      QuizMdParser.getAllRenderers(),
      content,
      variables,
      options
    ),
  init,
  contentLoaded,
};

export default quizmd;
