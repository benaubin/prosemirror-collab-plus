import typescript from "@wessberg/rollup-plugin-ts";

const external = ["prosemirror-state", "prosemirror-transform"];

export default [
  {
    input: ["./src/index.ts"],
    output: [
      {
        dir: "dist",
        format: "cjs",
        entryFileNames: "[name].js",
      },
      {
        dir: "dist",
        format: "es",
        entryFileNames: "[name].mjs",
      },
    ],
    external,
    plugins: [typescript()],
  },
];
