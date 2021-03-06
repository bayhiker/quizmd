import { RendererParams } from "./quizmd-renderer";
import { QuizMdParser } from "../..";
import { renderers as geometryRenderers } from "./quizmd-geometry";

const sharedSvg = 'viewBox="0, 0, 100, 100" xmlns="http://www.w3.org/2000/svg"';
const allRenderers = QuizMdParser.getAllRenderers();
const renderIt = (name: string, rendererParams: RendererParams) => {
  return new geometryRenderers[name](allRenderers, rendererParams).render();
};
const globalAttrs = 'fill="none" stroke-width="0.1" stroke="black"';

describe("quizmd-plugin-geometry", () => {
  test("svg", () => {
    const htmlSvg = renderIt("svg", {
      width: 30,
      height: 40,
      viewPort: "0 0 100 100",
    });
    expect(htmlSvg).toEqual(
      `<svg width="30" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>`
    );
  });

  test("circle", () => {
    const htmlSvg = renderIt("circle", { r: "3" });
    expect(htmlSvg).toEqual(`<circle r="3" cx="50" cy="50" ${globalAttrs}/>`);
  });

  test("ellipse", () => {
    const htmlSvg = renderIt("ellipse", { rx: "5", ry: "10" });
    expect(htmlSvg).toEqual(
      `<ellipse rx="5" ry="10" cx="50" cy="50" ${globalAttrs}/>`
    );
  });

  test("polygon", () => {
    const htmlSvg = renderIt("polygon", {
      points: "0,0 100,100 100,200 0,100",
    });
    expect(htmlSvg).toEqual(
      `<polygon points="0,0 100,100 100,200 0,100" ${globalAttrs}/>`
    );
  });

  test("polygon error no points", () => {
    expect(() => renderIt("polygon", {})).toThrow(/Points not defined/);
  });

  test("polyline", () => {
    const htmlSvg = renderIt("polyline", {
      points: "0,0 100,100 100,200 0,100",
    });
    expect(htmlSvg).toEqual(
      `<polyline points="0,0 100,100 100,200 0,100" ${globalAttrs}/>`
    );
  });

  test("rect", () => {
    const htmlSvg = renderIt("rect", {
      width: "100",
      height: "50",
    });
    expect(htmlSvg).toEqual(
      `<rect width="100" height="50" x="0" y="0" ${globalAttrs}/>`
    );
  });

  test("rhombus", () => {
    const htmlSvg = renderIt("rhombus", { p: "5", q: "10" });
    expect(htmlSvg).toEqual(
      `<polygon points="50,55 52.5,50 50,45 47.5,50" ${globalAttrs}/>`
    );
  });

  test("square", () => {
    const htmlSvg = renderIt("square", { side: "100" });
    expect(htmlSvg).toEqual(
      `<rect width="100" height="100" x="0" y="0" ${globalAttrs}/>`
    );
  });
});
