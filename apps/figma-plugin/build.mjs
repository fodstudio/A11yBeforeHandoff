import * as esbuild from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const watch = process.argv.includes("--watch");
await mkdir(new URL("./dist/", import.meta.url), { recursive: true });

async function writeUiHtml() {
  const [template, css, js] = await Promise.all([
    readFile(new URL("./src/ui.html", import.meta.url), "utf8"),
    readFile(new URL("./src/ui.css", import.meta.url), "utf8"),
    readFile(new URL("./dist/ui.js", import.meta.url), "utf8")
  ]);
  const html = template.replace("/* __STYLES__ */", css).replace("/* __SCRIPT__ */", js);
  await writeFile(new URL("./dist/ui.html", import.meta.url), html);
}

const codeOptions = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  platform: "browser",
  target: "es2020",
  format: "iife",
  logLevel: "info"
};

const uiOptions = {
  entryPoints: ["src/ui.ts"],
  bundle: true,
  outfile: "dist/ui.js",
  platform: "browser",
  target: "es2020",
  format: "iife",
  logLevel: "info",
  plugins: [{
    name: "inline-ui",
    setup(build) {
      build.onLoad({ filter: /src\/ui\.ts$/ }, async (args) => ({
        contents: await readFile(args.path, "utf8"),
        loader: "ts",
        watchFiles: [
          fileURLToPath(new URL("./src/ui.css", import.meta.url)),
          fileURLToPath(new URL("./src/ui.html", import.meta.url))
        ]
      }));
      build.onEnd(async (result) => {
        if (!result.errors.length) await writeUiHtml();
      });
    }
  }]
};

if (watch) {
  const [codeContext, uiContext] = await Promise.all([esbuild.context(codeOptions), esbuild.context(uiOptions)]);
  await Promise.all([codeContext.watch(), uiContext.watch()]);
  console.log("Watching Figma plugin source…");
} else {
  await esbuild.build(codeOptions);
  await esbuild.build(uiOptions);
}
