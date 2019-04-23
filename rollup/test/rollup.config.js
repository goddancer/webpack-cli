import babel from "rollup-plugin-babel";
// import uglify from "rollup-plugin-uglify";

export default {
  input: "test/test.js",
  output: {
    file: "test/rollup.test.js",
    format: "esm"
  },
  treeshake: true,
  plugins: [babel()]
};
