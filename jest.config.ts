import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  verbose: true,
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/dist/"],
};
export default config;
