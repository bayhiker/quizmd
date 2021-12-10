import quizmd from "./quizmd";

describe("QuizMd Test", () => {
  test("getRenderers", async () => {
    const { getAllRenderers } = quizmd;
    const renderers = await getAllRenderers();
    expect(Object.keys(renderers).length).toEqual(11);
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
