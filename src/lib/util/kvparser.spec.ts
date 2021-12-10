import kvparse from "./kvparser";

describe("kvparser", () => {
  test("kvparse, single flag", () => {
    expect(kvparse("k1")["k1"]).toEqual(true);
  });

  test("kvparse, single k-v", () => {
    expect(kvparse("k1=v1")["k1"]).toEqual("v1");
  });

  test("kvparse, with dash", () => {
    expect(kvparse("k-with-dash=v")["k-with-dash"]).toEqual("v");
  });

  test("kvparse, multiple k-v", () => {
    expect(kvparse("k1=v1 k2=v2")["k1"]).toEqual("v1");
    expect(kvparse("k1=v1 k2=v2")["k2"]).toEqual("v2");
  });

  test("kvparse, multiple flags", () => {
    expect(kvparse("k1 k2")["k1"]).toEqual(true);
    expect(kvparse("k1 k2")["k2"]).toEqual(true);
  });

  test("kvparse, double quote", () => {
    expect(kvparse('"k1 1"="v1 1"')["k1 1"]).toEqual("v1 1");
  });

  test("kvparse, single quote", () => {
    expect(kvparse("'k1 1'='v1 1'")["k1 1"]).toEqual("v1 1");
  });

  test("kvparse, escape single quote", () => {
    expect(kvparse("'k1 \\' 1'='v1 \\' 1'")["k1 ' 1"]).toEqual("v1 ' 1");
  });

  test("kvparse, escape double quote", () => {
    expect(kvparse('"k1 \\" 1"="v1 \\" 1"')['k1 " 1']).toEqual('v1 " 1');
  });

  test("kvparse, mixed k-v and flags", () => {
    const d = kvparse("k1=v1 k2 k3=v3 k4 k5");
    expect(d["k1"]).toEqual("v1");
    expect(d["k2"]).toEqual(true);
    expect(d["k3"]).toEqual("v3");
    expect(d["k4"]).toEqual(true);
    expect(d["k5"]).toEqual(true);
  });

  test("kvparse, value override", () => {
    const d = kvparse("k1=v1 k2 k2=v2 k3");
    expect(d["k2"]).toEqual("v2");
  });

  test("kvparse, empty key", () => {
    expect(() => {
      kvparse('""=v1');
    }).toThrow();
  });

  test("kvparse, misplaced =", () => {
    const spy = jest.spyOn(globalThis.console, "warn").mockImplementation();
    kvparse("=v1 k2 k2=v2 k3");
    expect(console.warn).toHaveBeenCalled();
    spy.mockRestore();
  });
});
