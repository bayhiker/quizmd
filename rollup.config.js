import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";
import pkg from "./package.json";

const bundle = (config) => ({
  ...config,
  input: "src/index.ts",
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: `dist/${pkg.main}`,
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: `dist/${pkg.module}`,
        format: "es",
        sourcemap: true,
      },
      {
        file: `dist/${pkg.browser}`,
        name: pkg.name,
        format: "iife",
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `dist/${pkg.typings}`,
      format: "es",
    },
  }),
];
