import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const commands = [
  ["run", "dev", "--workspace", "@a11y/server"],
  ["run", "dev", "--workspace", "@a11y/web"]
];
const children = commands.map((args) => spawn(npm, args, { stdio: "inherit", shell: false }));

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 100).unref();
}
for (const child of children) child.on("exit", (code) => { if (!stopping && code) stop(code); });
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
