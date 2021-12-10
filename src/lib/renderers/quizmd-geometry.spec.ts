import { RendererParams } from "./quizmd-renderer";
import { QuizMdParser } from "../parser";
import { renderers as geometryRenderers } from "./quizmd-geometry";

const sharedSvg = 'viewBox="0, 0, 100, 100" xmlns="http://www.w3.org/2000/svg"';
const allRenderers = QuizMdParser.getAllRenderers();
const renderIt = async (name: string, rendererParams: RendererParams) => {
  return await new geometryRenderers[name](
    allRenderers,
    rendererParams
  ).render();
};
const globalAttrs = 'fill="none" stroke-width="0.1" stroke="black"';

describe("quizmd-plugin-geometry", () => {
  test("svg", async () => {
    const htmlSvg = await renderIt("svg", { viewPort: "0 0 100 100" });
    expect(htmlSvg).toEqual(
      `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"></svg>`
    );
  });

  test("circle", async () => {
    const htmlSvg = await renderIt("circle", { r: "3" });
    expect(htmlSvg).toEqual(`<circle r="3" cx="5" cy="5" ${globalAttrs}/>`);
  });

  test("ellipse", async () => {
    const htmlSvg = await renderIt("ellipse", { rx: "5", ry: "10" });
    expect(htmlSvg).toEqual(
      `<ellipse rx="5" ry="10" cx="5" cy="5" ${globalAttrs}/>`
    );
  });

  test("polygon", async () => {
    const htmlSvg = await renderIt("polygon", {
      points: "0,0 100,100 100,200 0,100",
    });
    expect(htmlSvg).toEqual(
      `<polygon points="0,0 100,100 100,200 0,100" ${globalAttrs}/>`
    );
  });

  test("polygon error no points", async () => {
    await expect(renderIt("polygon", {})).rejects.toThrowError(
      /Points not defined/
    );
  });

  test("polyline", async () => {
    const htmlSvg = await renderIt("polyline", {
      points: "0,0 100,100 100,200 0,100",
    });
    expect(htmlSvg).toEqual(
      `<polyline points="0,0 100,100 100,200 0,100" ${globalAttrs}/>`
    );
  });

  test("rect", async () => {
    const htmlSvg = await renderIt("rect", {
      width: "100",
      height: "50",
    });
    expect(htmlSvg).toEqual(
      `<rect width="100" height="50" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("rhombus", async () => {
    const htmlSvg = await renderIt("rhombus", { p: "5", q: "10" });
    expect(htmlSvg).toEqual(
      `<polygon points="5,10 7.5,5 5,0 2.5,5" ${globalAttrs}/>`
    );
  });

  test("square", async () => {
    const htmlSvg = await renderIt("square", { side: "100" });
    expect(htmlSvg).toEqual(
      `<rect width="100" height="100" x="0" y="0" ${globalAttrs}/>`
    );
  });
});
