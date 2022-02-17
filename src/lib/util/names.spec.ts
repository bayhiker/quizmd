import {
  getRandomBoyName,
  getRandomGirlName,
  getRandomName,
  isBoyName,
  isGirlName,
} from "./names";

describe("names", () => {
  test("Names, isGirlName existing", () => {
    expect(isGirlName("Mary")).toEqual(true);
  });
  test("Names, isGirlName non-existent", () => {
    expect(isGirlName("MaryAnneAnne")).toEqual(false);
  });
  test("Names, isBoyName existing", () => {
    expect(isBoyName("Michael")).toEqual(true);
  });
  test("Names, isBoyName non-existent", () => {
    expect(isBoyName("MichaelSomething")).toEqual(false);
  });

  test("Get random boy name ", () => {
    expect(isBoyName(getRandomBoyName())).toEqual(true);
  });

  test("Get random girl name", () => {
    expect(isGirlName(getRandomGirlName())).toEqual(true);
  });

  test("Get random name with boy name", () => {
    expect(isBoyName(getRandomName("Michael"))).toEqual(true);
  });
  test("Get random name with girl name", () => {
    expect(isGirlName(getRandomName("Mary"))).toEqual(true);
  });

  test("Get random name with no name", () => {
    const randomName = getRandomName();
    expect(isGirlName(randomName) || isBoyName(randomName)).toEqual(true);
  });
});
