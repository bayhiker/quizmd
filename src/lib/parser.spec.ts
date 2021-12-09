import { QuizMdDirectives, QuizMdParser } from "./parser";
import {
  QuizMdRenderer,
  QuizMdRenderers,
  RendererParams,
} from "./renderers/quizmd-renderer";

const allRenderers: QuizMdRenderers = QuizMdParser.getAllRenderers();

describe("QuizMdParser Unit Test", () => {
  test("No compilation error", async () => {
    const quizMdParser = new QuizMdParser({});
    const element = document.createElement("div");
    element.appendChild(document.createTextNode("square: r=10"));
    await quizMdParser.parseNode(element);
    const regExp = new RegExp(
      '^.*?<svg viewBox="0, 0, 100, 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" x="0" y="0" fill="none" stroke="black"></rect></svg>.*$'
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

  test("parseNode, processed tag", async () => {
    const quizMdParser = new QuizMdParser({});
    const processedTag = quizMdParser.config["processedFlagAttrName"] as string;
    const element = document.createElement("div");

    // Make sure element is not processed because processed attr was set
    element.appendChild(document.createTextNode("square: side=10"));
    element.setAttribute(processedTag, "true");
    await quizMdParser.parseNode(element);
    expect(element.innerHTML).toEqual("square: side=10");

    element.removeAttribute(processedTag);
    await quizMdParser.parseNode(element);
    expect(element.innerHTML).toMatch(
      '<rect width="10" height="10" x="0" y="0" fill="none" stroke="black"></rect>'
    );
    expect(element.getAttribute(processedTag)).toBeTruthy();
  });

  test("parser, parse node list", async () => {
    const quizMdParser = new QuizMdParser({});
    const elementSquare = document.createElement("div");
    elementSquare.appendChild(document.createTextNode("square: side=10"));
    const elementCircle = document.createElement("div");
    elementCircle.appendChild(document.createTextNode("circle: r=10"));
    await quizMdParser.parseNodeList([elementSquare, elementCircle]);
    expect(elementSquare.innerHTML).toMatch(/<rect/);
    expect(elementCircle.innerHTML).toMatch(/<circle/);
  });

  test("parser, parse container", async () => {
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
    await quizMdParser.parseContainer(element);
    expect(elementSquare.innerHTML).toMatch(/<rect/);
    expect(elementCircle.innerHTML).toMatch(/<circle/);
  });

  test("parser, parse with callback", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    const quizMdParser = new QuizMdParser({});
    const element = document.createElement("div");
    const elementSquare = document.createElement("div");
    elementSquare.className = "quizmd";
    elementSquare.appendChild(document.createTextNode("square: side=10"));
    element.appendChild(elementSquare);
    await quizMdParser.parseContainer(element, ".quizmd", (id: string) => {
      console.log(`test id is ${id}`);
    });
    expect(elementSquare.innerHTML).toMatch(/<rect/);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("parseNode, with custom config", async () => {
    const quizMdParser = new QuizMdParser({});
    const element = document.createElement("div");
    const customAttr = "quizmd-customized-attr";
    element.appendChild(
      document.createTextNode(`%%{config: processedFlagAttrName="${customAttr}"}%%
    square: side=10`)
    );
    await quizMdParser.parseNode(element);
    expect(element.innerHTML).toMatch(/<rect/);
    expect(element.getAttribute(customAttr)).toBeTruthy();
  });
});

describe("renderer", () => {
  test("parseContent, regular single line", async () => {
    const s = await QuizMdRenderer.parseContent(allRenderers, [
      `square: side=50`,
    ]);
    expect(s).toMatch(
      '<rect width="50" height="50" x="0" y="0" fill="none" stroke="black"/>'
    );
  });

  test("parseContent, line ends with backslash", async () => {
    const s = await QuizMdRenderer.parseContent(allRenderers, [
      "square: \\",
      "side=50",
    ]);
    expect(s).toMatch(
      '<rect width="50" height="50" x="0" y="0" fill="none" stroke="black"/>'
    );
  });

  test("parseContent, with key:-", async () => {
    const s = await QuizMdRenderer.parseContent(allRenderers, [
      `square:- some text`,
    ]);
    expect(s).toMatch(
      '<rect width="100" height="100" x="0" y="0" fill="none" stroke="black"/>'
    );
  });

  test("parseContent, indention key:-", async () => {
    const s = await QuizMdRenderer.parseContent(allRenderers, [
      "square: side=50",
      "  rect: width=30 height=50",
    ]);
    expect(s).toMatch(
      '<rect width="50" height="50" x="0" y="0" fill="none" stroke="black"/>'
    );
    expect(s).toMatch(
      '<rect width="30" height="50" x="0" y="0" fill="none" stroke="black"/>'
    );
  });

  test("parserContent, invalid renderer", async () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    const s = await QuizMdRenderer.parseContent(allRenderers, [
      "this-renderer-does-not-exist: x=5",
    ]);
    expect(spy).toHaveBeenCalled();
    expect(s).toEqual("");
    spy.mockRestore();
  });

  test("parseContent, two entity lines", async () => {
    const s = await QuizMdRenderer.parseContent(allRenderers, [
      "square: side=50",
      "rect: width=30 height=50",
    ]);
    expect(s).toMatch(
      '<rect width="50" height="50" x="0" y="0" fill="none" stroke="black"/>'
    );
    expect(s).toMatch(
      '<rect width="30" height="50" x="0" y="0" fill="none" stroke="black"/>'
    );
  });

  test("QuizMdRenderer, render() not defined", async () => {
    class RendererMissingRenderStartingFunction extends QuizMdRenderer {
      constructor(
        allRenderers: QuizMdRenderers,
        rendererParams: RendererParams,
        contentLines: string[] = []
      ) {
        super(allRenderers, rendererParams, contentLines);
      }
    }
    const renderer = new RendererMissingRenderStartingFunction(
      allRenderers,
      {}
    );
    await expect(async () => {
      await renderer.render();
    }).rejects.toThrow();
  });

  test("parserContent, renderer with no config, improve coverage for parseContent", async () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    const s = await QuizMdRenderer.parseContent(allRenderers, [
      "this-renderer-does-not-exist-and-has-no-config",
    ]);
    expect(spy).toHaveBeenCalled();
    expect(s).toEqual("");
    spy.mockRestore();
  });
});
