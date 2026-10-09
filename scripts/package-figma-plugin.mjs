import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const output = new URL("../apps/web/public/downloads/a11y-handoff-figma-plugin.zip", import.meta.url);
const folder = "a11y-handoff-figma-plugin";

const installGuide = `A11y Handoff — Figma plugin MVP

EN
1. Unzip this download.
2. Open a Figma Design file in the Figma desktop app.
3. Choose Plugins > Development > Import plugin from manifest.
4. Select manifest.json from this folder, then run A11y Handoff from Development.

日本語
1. ダウンロードしたZIPを展開します。
2. FigmaデスクトップアプリでDesignファイルを開きます。
3. Plugins > Development > Import plugin from manifestを選びます。
4. このフォルダのmanifest.jsonを選び、DevelopmentからA11y Handoffを実行します。

한국어
1. 다운로드한 ZIP의 압축을 풉니다.
2. Figma 데스크톱 앱에서 Design 파일을 엽니다.
3. Plugins > Development > Import plugin from manifest를 선택합니다.
4. 이 폴더의 manifest.json을 선택한 뒤 Development에서 A11y Handoff를 실행합니다.

This is a local development install and is not yet a Figma Community release.
https://a11yhandoff.com/figma-plugin
`;

const sources = [
  ["manifest.json", new URL("../apps/figma-plugin/manifest.json", import.meta.url)],
  ["dist/code.js", new URL("../apps/figma-plugin/dist/code.js", import.meta.url)],
  ["dist/ui.html", new URL("../apps/figma-plugin/dist/ui.html", import.meta.url)],
  ["LICENSE", new URL("../LICENSE", import.meta.url)],
];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function localHeader(name, data, checksum, timestamp) {
  const nameBytes = Buffer.from(name);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(timestamp.time, 10);
  header.writeUInt16LE(timestamp.day, 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBytes.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, nameBytes, data]);
}

function centralHeader(name, data, checksum, timestamp, offset) {
  const nameBytes = Buffer.from(name);
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(timestamp.time, 12);
  header.writeUInt16LE(timestamp.day, 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(data.length, 20);
  header.writeUInt32LE(data.length, 24);
  header.writeUInt16LE(nameBytes.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, nameBytes]);
}

function endOfCentralDirectory(entryCount, centralSize, centralOffset) {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(0, 4);
  record.writeUInt16LE(0, 6);
  record.writeUInt16LE(entryCount, 8);
  record.writeUInt16LE(entryCount, 10);
  record.writeUInt32LE(centralSize, 12);
  record.writeUInt32LE(centralOffset, 16);
  record.writeUInt16LE(0, 20);
  return record;
}

const entries = await Promise.all(sources.map(async ([name, url]) => ({
  name: `${folder}/${name}`,
  data: await readFile(fileURLToPath(url)),
})));
entries.push({ name: `${folder}/INSTALL.txt`, data: Buffer.from(installGuide) });

// A fixed timestamp keeps the generated download identical across local and production builds.
const timestamp = { time: 0, day: ((2000 - 1980) << 9) | (1 << 5) | 1 };
const localParts = [];
const centralParts = [];
let offset = 0;

for (const entry of entries) {
  const checksum = crc32(entry.data);
  const local = localHeader(entry.name, entry.data, checksum, timestamp);
  localParts.push(local);
  centralParts.push(centralHeader(entry.name, entry.data, checksum, timestamp, offset));
  offset += local.length;
}

const centralDirectory = Buffer.concat(centralParts);
const archive = Buffer.concat([
  ...localParts,
  centralDirectory,
  endOfCentralDirectory(entries.length, centralDirectory.length, offset),
]);

await mkdir(new URL("../apps/web/public/downloads/", import.meta.url), { recursive: true });
await writeFile(output, archive);
console.log(`Created ${fileURLToPath(output)} (${archive.length} bytes)`);
