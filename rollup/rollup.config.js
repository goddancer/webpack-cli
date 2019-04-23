import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";

const distPath = "./dist/";
const namePerfix = "yfAuth";

export default {
  input: "src/index.js",
  output: [
    {
      file: `${distPath}${namePerfix}.cjs.js`,
      format: "cjs",
      name: `${namePerfix}.cjs.js`
    },
    {
      file: `${distPath}${namePerfix}.esm.js`,
      format: "es",
      name: `${namePerfix}.esm.js`
    },
    {
      file: `${distPath}${namePerfix}.iife.js`,
      format: "iife",
      name: `${namePerfix}.iife.js`
    },
    {
      file: `${distPath}${namePerfix}.umd.js`,
      format: "umd",
      name: `${namePerfix}.umd.js`
    }
  ],
  plugins: [
    // resolve(),
    commonjs(),
    babel({
      exclude: "node_modules/**",
      runtimeHelpers: true,
      babelrc: false
    })
  ],
  // indicate which modules should be treated as external
  external: ["SJCL", "MD5", "COOKIE", "urlParser"]
};
