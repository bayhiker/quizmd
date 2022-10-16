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

  test("polygon with node names", () => {
    const htmlSvg = renderIt("polygon", {
      points: "0,0 100,0 100,100 0,100",
      stroke: "green",
      labels: "A,B,C,D",
      lengths: "1,2,3,4",
      labelFill: "red",
    });
    const nodes = [
      `<text x="0" y="10" fill="red">A</text>`,
      `<text x="113" y="10" fill="red">B</text>`,
      `<text x="113" y="118" fill="red">C</text>`,
      `<text x="0" y="118" fill="red">D</text>`,
      `<text x="56" y="10" fill="red">1</text>`,
      `<text x="113" y="64" fill="red">2</text>`,
      `<text x="56" y="118" fill="red">3</text>`,
      `<text x="0" y="64" fill="red">4</text>`,
    ];
    expect(htmlSvg).toEqual(
      `<polygon points="11,8 111,8 111,108 11,108" ${globalAttrs.replace(
        "black",
        "green"
      )}/>${nodes.join("")}`
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

  test("polyline with node names", () => {
    const htmlSvg = renderIt("polyline", {
      points: "0,0 100,100 100,200 0,100",
      labels: "A,B,C,D",
    });
    const nodes = [
      `<text x="8" y="10" fill="none">A</text>`,
      `<text x="117" y="110" fill="none">B</text>`,
      `<text x="117" y="218" fill="none">C</text>`,
      `<text x="0" y="118" fill="none">D</text>`,
    ];
    expect(htmlSvg).toEqual(
      `<polyline points="15,8 115,108 115,208 15,108" ${globalAttrs}/>${nodes.join(
        ""
      )}`
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
