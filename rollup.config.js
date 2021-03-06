"use strict";

import clean from "rollup-plugin-clean";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import screeps from "rollup-plugin-screeps";

let cfg;
const i = process.argv.indexOf("--dest") + 1;
if (i == 0) {
  console.log("No destination specified - code will be compiled but not uploaded");
} else if (i >= process.argv.length || (cfg = require("./screeps")[process.argv[i]]) == null) {
  throw new Error("Invalid upload destination");
}

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    sourcemap: true,
    intro: "const DONE = 1;",
    globals: {
      DONE: "DONE"
    },
  },

  plugins: [
    clean(),
    resolve(),
    commonjs({
      include: ['node_modules/**', 'src/**'],
      namedExports: {
        'src/ExpansionPlanner.js': ['run'],
        'src/Sources.js': [
          'getContainerFor',
          'getMemoryFor',
          'getMinersFor',
        ],
        'src/Controllers.js': ['getOwner'],
        'src/Rooms.js': [
          'getDefenseMission',
          'getFriendlyTowers',
          'getScoutMissionFrom',
        ],
      },
    }),
    typescript({tsconfig: "./tsconfig.json"}),
    screeps({config: cfg, dryRun: cfg == null})
  ]
}
