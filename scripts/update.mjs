// 内閣府の祝日 CSV を取得し、syukujitsu.csv（UTF-8 に直した写し）と holidays.json を作り直す。
// GitHub Actions（.github/workflows/update.yml）が動かす。手元では npm run update。
//
//   --from <ファイル>  ネットワークを使わず、手元の CSV（Shift_JIS か UTF-8）から作る
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CSV_URL, checkFeed, decodeCsv, parseHolidayCsv } from "./parse.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const fromIndex = process.argv.indexOf("--from");
const from = fromIndex >= 0 ? process.argv[fromIndex + 1] : undefined;

async function download() {
  const response = await fetch(CSV_URL, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`祝日 CSV を取得できませんでした（${response.status}）: ${CSV_URL}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

const bytes = from ? new Uint8Array(await readFile(from)) : await download();
const text = decodeCsv(bytes);
const parsed = parseHolidayCsv(text);
if (!parsed.ok) {
  console.error(parsed.error);
  process.exit(1);
}
const problem = checkFeed(parsed.feed, new Date().getFullYear());
if (problem) {
  console.error(problem);
  process.exit(1);
}

const csv = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").trimEnd() + "\n";
await writeFile(new URL("syukujitsu.csv", `file://${root}`), csv);
await writeFile(
  new URL("holidays.json", `file://${root}`),
  JSON.stringify(parsed.feed, null, 2) + "\n",
);
const { feed } = parsed;
console.log(
  `祝日を ${Object.keys(feed.holidays).length} 件書き出しました（${feed.minYear}〜${feed.maxYear} 年）`,
);
