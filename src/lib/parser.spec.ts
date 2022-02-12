import { QuizMdDirectives, QuizMdParser } from "./parser";
import {
  QuizMdRenderer,
  QuizMdRenderers,
  RendererParams,
} from "./renderers/quizmd-renderer";

const allRenderers: QuizMdRenderers = QuizMdParser.getAllRenderers();
const globalAttrs = 'fill="none" stroke-width="0.1" stroke="black"';

describe("QuizMdParser Unit Test", () => {
  test("No compilation error", () => {
    const quizMdParser = new QuizMdParser({});
    const element = document.createElement("div");
    element.appendChild(document.createTextNode("square: r=10"));
    quizMdParser.parseNode(element);
    const regExp = new RegExp(
      '^.*?<rect width="100" height="100" x="0" y="0" .*?></rect>.*$'
    );
    expect(element.innerHTML).toMatch(regExp);
  });

  test("extractConfig", () => {
    const quizMdDirectives = new QuizMdDirectives(
      `some text %%{config: "a"="b" "c"=15 }%% some other text`
    );
    const extractedConfig = quizMdDirectives.getConfig();
    expect(extractedConfig["a"] as string).toEqual("b");
    expect(extractedConfig["c"] as number).toEqual("15");
  });

  test("parseNode, processed tag", () => {
    const quizMdParser = new QuizMdParser({});
    const processedTag = quizMdParser.config["processedFlagAttrName"] as string;
    const element = document.createElement("div");

    // Make sure element is not processed because processed attr was set
    element.appendChild(document.createTextNode("square: side=10"));
    element.setAttribute(processedTag, "true");
    quizMdParser.parseNode(element);
    expect(element.innerHTML).toEqual("square: side=10");

    element.removeAttribute(processedTag);
    quizMdParser.parseNode(element);
    expect(element.innerHTML).toMatch(
      `<rect width="10" height="10" x="0" y="0" ${globalAttrs}></rect>`
    );
    expect(element.getAttribute(processedTag)).toBeTruthy();
  });

  test("parser, parse node list", () => {
    const quizMdParser = new QuizMdParser({});
    const elementSquare = document.createElement("div");
    elementSquare.appendChild(document.createTextNode("square: side=10"));
    const elementCircle = document.createElement("div");
    elementCircle.appendChild(document.createTextNode("circle: r=10"));
    quizMdParser.parseNodeList([elementSquare, elementCircle]);
    expect(elementSquare.innerHTML).toMatch(/<rect/);
    expect(elementCircle.innerHTML).toMatch(/<circle/);
  });

  test("parser, parse container", () => {
    const quizMdParser = new QuizMdParser({});
    const element = document.createElement("div");
    const elementSquare = document.createElement("div");
    elementSquare.className = "quizmd";
    elementSquare.appendChild(document.createTextNode("square: side=10"));
    element.appendChild(elementSquare);
    const elementCircle = document.createElement("div");
    elementCircle.className = "quizmd";
    elementCircle.appendChild(document.createTextNode("circle: r=10"));
    element.appendChild(elementCircle);
    quizMdParser.parseContainer(element);
    expect(elementSquare.innerHTML).toMatch(/<rect/);
    expect(elementCircle.innerHTML).toMatch(/<circle/);
  });

  test("parser, parse with callback", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    const quizMdParser = new QuizMdParser({});
    const element = document.createElement("div");
    const elementSquare = document.createElement("div");
    elementSquare.className = "quizmd";
    elementSquare.appendChild(document.createTextNode("square: side=10"));
    element.appendChild(elementSquare);
    quizMdParser.parseContainer(element, ".quizmd", (id: string) => {
      console.log(`test id is ${id}`);
    });
    expect(elementSquare.innerHTML).toMatch(/<rect/);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("parseNode, with custom config", () => {
    const quizMdParser = new QuizMdParser({});
    const element = document.createElement("div");
    const customAttr = "quizmd-customized-attr";
    element.appendChild(
      document.createTextNode(`%%{config: processedFlagAttrName="${customAttr}"}%%
    square: side=10`)
    );
    quizMdParser.parseNode(element);
    expect(element.innerHTML).toMatch(/<rect/);
    expect(element.getAttribute(customAttr)).toBeTruthy();
  });
});

describe("renderer", () => {
  test("parseContent, regular single line", () => {
    const s = QuizMdRenderer.parseLines(allRenderers, [`square: side=50`]);
    expect(s).toMatch(
      `<rect width="50" height="50" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("parseContent, with svg", () => {
    const s = QuizMdRenderer.parseLines(allRenderers, [
      "svg",
      `  square: side=50`,
    ]);
    expect(s).toMatch(`svg`);
    expect(s).toMatch(
      `<rect width="50" height="50" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("parseContent, line ends with backslash", () => {
    const s = QuizMdRenderer.parseLines(allRenderers, [
      "square: \\",
      "side=50",
    ]);
    expect(s).toMatch(
      `<rect width="50" height="50" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("parseContent, with key:-", () => {
    const s = QuizMdRenderer.parseLines(allRenderers, [`square:- some text`]);
    expect(s).toMatch(
      `<rect width="100" height="100" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("parseContent, indention key:-", () => {
    const s = QuizMdRenderer.parseLines(allRenderers, [
      "square: side=50",
      "  rect: width=30 height=50",
    ]);
    expect(s).toMatch(
      `<rect width="50" height="50" x="0" y="0" ${globalAttrs}/>`
    );
    expect(s).toMatch(
      `<rect width="30" height="50" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("parserContent, invalid renderer", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    const s = QuizMdRenderer.parseLines(allRenderers, [
      "this-renderer-does-not-exist: x=5",
    ]);
    expect(spy).toHaveBeenCalled();
    expect(s).toEqual("");
    spy.mockRestore();
  });

  test("parseContent, two entity lines", () => {
    const s = QuizMdRenderer.parseLines(allRenderers, [
      "square: side=50",
      "rect: width=30 height=50",
    ]);
    expect(s).toMatch(
      `<rect width="50" height="50" x="0" y="0" ${globalAttrs}/>`
    );
    expect(s).toMatch(
      `<rect width="30" height="50" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("QuizMdRenderer, render() not defined", () => {
    class RendererMissingRenderStartingFunction extends QuizMdRenderer {
      constructor(
        allRenderers: QuizMdRenderers,
        rendererParams: RendererParams,
        childLines: string[] = []
      ) {
        super(allRenderers, rendererParams, childLines);
      }
    }
    const renderer = new RendererMissingRenderStartingFunction(
      allRenderers,
      {}
    );
    expect(() => {
      renderer.render();
    }).toThrow();
  });

  test("parserContent, renderer with no config, improve coverage for parseContent", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    const s = QuizMdRenderer.parseLines(allRenderers, [
      "this-renderer-does-not-exist-and-has-no-config",
    ]);
    expect(spy).toHaveBeenCalled();
    expect(s).toEqual("");
    spy.mockRestore();
  });
});
