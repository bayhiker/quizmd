import quizmd from "./quizmd";

describe("QuizMd Test", () => {
  test("getRenderers", () => {
    const { getAllRenderers } = quizmd;
    const renderers = getAllRenderers();
    expect(Object.keys(renderers).length).toEqual(11);
  });

  test("parse", async () => {
    const { parse } = quizmd;
    const parsedContent = parse(["square: side=10"]);
    const regExp = new RegExp(
      '^.*?<rect width="10" height="10" x="0" y="0" .*?/>.*$'
    );
    expect(parsedContent).toMatch(regExp);
  });

  it("do not render if startOnLoad is set to false", function () {
    quizmd.startOnLoad = false;
    document.body.innerHTML = `<div class='.quizmd'>square: side=10</div>`;
    jest.spyOn(quizmd, "init");
    quizmd.contentLoaded();
    expect(quizmd.init).not.toHaveBeenCalled();
  });

  it("render if startOnLoad is set to true", function () {
    quizmd.startOnLoad = true;
    document.body.innerHTML = `<div class='.quizmd'>square: side=10</div>`;
    jest.spyOn(quizmd, "init");
    quizmd.contentLoaded();
    expect(quizmd.init).toHaveBeenCalled();
  });

  it("render if startOnLoad is using default value", function () {
    document.body.innerHTML = `<div class='.quizmd'>square: side=10</div>`;
    jest.spyOn(quizmd, "init");
    quizmd.contentLoaded();
    expect(quizmd.init).toHaveBeenCalled();
  });
});
