import { QuizMdVariable } from "./quizmd-variable";

// defaultValue, lowerBound, upperBound
const intFloatCases = [
  [1000, 500, 2000],
  [75, 0, 150],
  [0, -50, 50],
  [-75, -150, 0],
  [-1000, -2000, -500],
  [1000.0, 500.0, 2000.0],
  [75.0, 0.0, 150.0],
  [0.0, -50.0, 50.0],
  [-75.0, -150.0, 0.0],
  [-1000.0, -2000.0, -500.0],
];

describe("quizmd-variable", () => {
  test.each(intFloatCases)(
    "int cases",
    (defaultValue, lowerBound, upperBound) => {
      const v: QuizMdVariable = QuizMdVariable.fromDefaultValue(
        `${defaultValue}`
      );
      expect(v.defaultValue).toEqual(defaultValue);
      const randomValue = v.getRandomValue();
      expect(randomValue).toBeGreaterThanOrEqual(lowerBound);
      expect(randomValue).toBeLessThanOrEqual(upperBound);
    }
  );

  test("Same number of decimal digits", () => {
    const randomValue =
      QuizMdVariable.fromDefaultValue("10.23").getRandomValue();
    expect((randomValue * 100) % 1).toBeLessThan(0.000001);
  });
});
