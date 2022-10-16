import { shuffle } from "./misc";

describe("misc utils", () => {
  test("shuffle, shuffle is random", () => {
    const count = {
      "123": 0,
      "132": 0,
      "213": 0,
      "231": 0,
      "321": 0,
      "312": 0,
    };

    const iterations = 1000000;
    for (let i = 0; i < iterations; i++) {
      const a = [1, 2, 3];
      shuffle(a);
      count[a.join("")]++;
    }

    // Check counts of all possible permutations are about the same
    for (const k in count) {
      const unevenness = Math.abs(iterations / 6 - count[k]) / iterations;
      expect(unevenness).toBeLessThanOrEqual(0.01);
    }
  });
});
