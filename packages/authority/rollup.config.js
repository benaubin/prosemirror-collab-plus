import typescript from "@wessberg/rollup-plugin-ts";

const external = [
  "prosemirror-transform",
  "prosemirror-model",
  "jsdom",
  "source-map-support",
];

export default [
  {
    input: ["./src/index.ts", "./src/rpc.ts"],
    output: [
      {
        dir: "dist",
        format: "cjs",
        entryFileNames: "[name].js",
        exports: "named",
        sourcemap: true,
      },
    ],
    external,
    plugins: [typescript()],
  },
];
