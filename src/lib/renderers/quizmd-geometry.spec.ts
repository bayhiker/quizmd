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

describe("quizmd-plugin-geometry", () => {
  test("circle", async () => {
    const htmlSvg = await renderIt("circle", { r: "50" });
    expect(htmlSvg).toEqual(
      `<svg viewBox="0, 0, 100, 100" xmlns="http://www.w3.org/2000/svg"><circle r="50" cx="50" cy="50" fill="none" stroke="black"/></svg>`
    );
  });

  test("ellipse", async () => {
    const htmlSvg = await renderIt("ellipse", { rx: "50", ry: "100" });
    expect(htmlSvg).toEqual(
      `<svg viewBox="0, 0, 100, 100" xmlns="http://www.w3.org/2000/svg"><ellipse rx="50" ry="100" cx="50" cy="50" fill="none" stroke="black"/></svg>`
    );
  });

  test("polygon", async () => {
    const htmlSvg = await renderIt("polygon", {
      points: "0,0 100,100 100,200 0,100",
    });
    expect(htmlSvg).toEqual(
      `<svg ${sharedSvg}><polygon points="0,0 100,100 100,200 0,100" fill="none" stroke="black"/></svg>`
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
      `<svg ${sharedSvg}><polyline points="0,0 100,100 100,200 0,100" fill="none" stroke="black"/></svg>`
    );
  });

  test("rect", async () => {
    const htmlSvg = await renderIt("rect", {
      width: "100",
      height: "50",
    });
    expect(htmlSvg).toEqual(
      `<svg ${sharedSvg}><rect width="100" height="50" x="0" y="0" fill="none" stroke="black"/></svg>`
    );
  });

  test("rhombus", async () => {
    const htmlSvg = await renderIt("rhombus", { p: "50", q: "100" });
    expect(htmlSvg).toEqual(
      `<svg ${sharedSvg}><polygon points="50,100 75,50 50,0 25,50" fill="none" stroke="black"/></svg>`
    );
  });

  test("square", async () => {
    const htmlSvg = await renderIt("square", { side: "100" });
    expect(htmlSvg).toEqual(
      `<svg ${sharedSvg}><rect width="100" height="100" x="0" y="0" fill="none" stroke="black"/></svg>`
    );
  });
});
