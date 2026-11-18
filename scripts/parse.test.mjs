import assert from "node:assert/strict";
import { test } from "node:test";
import { checkFeed, decodeCsv, parseHolidayCsv } from "./parse.mjs";

// 内閣府の CSV と同じ形（見出し 1 行、「年/月/日,名称」、CRLF）。
const CSV = [
  "国民の祝日・休日月日,国民の祝日・休日名称",
  "2026/1/1,元日",
  "2026/1/12,成人の日",
  "2026/11/3,文化の日",
  "2027/1/1,元日",
  "2025/11/24,休日",
  "",
].join("\r\n");

test("日付を YYYY-MM-DD にそろえ、日付順に並べ、範囲を出す", () => {
  assert.deepEqual(parseHolidayCsv(`﻿${CSV}`, "https://example.test/holidays.csv"), {
    ok: true,
    feed: {
      kind: "jp-holidays",
      version: 1,
      source: "https://example.test/holidays.csv",
      minYear: 2025,
      maxYear: 2027,
      holidays: {
        "2025-11-24": "休日",
        "2026-01-01": "元日",
        "2026-01-12": "成人の日",
        "2026-11-03": "文化の日",
        "2027-01-01": "元日",
      },
    },
  });
});

test("読めない行や、ありえない日付があれば失敗する", () => {
  assert.deepEqual(parseHolidayCsv("見出し\n2026-01-01,元日"), {
    ok: false,
    error: "2 行目を読めません: 2026-01-01,元日",
  });
  assert.equal(parseHolidayCsv("見出し\n2026/2/30,元日").ok, false);
  assert.equal(parseHolidayCsv("見出しだけ").ok, false);
});

test("Shift_JIS と UTF-8 のどちらも読める", () => {
  // 「元日」の Shift_JIS
  assert.equal(decodeCsv(new Uint8Array([0x8c, 0xb3, 0x93, 0xfa])), "元日");
  assert.equal(decodeCsv(new TextEncoder().encode("元日")), "元日");
});

test("量が少ないか今年を含まないデータは弾く", () => {
  const parsed = parseHolidayCsv(CSV);
  assert.ok(parsed.ok);
  assert.match(checkFeed(parsed.feed, 2026), /少なすぎる/);
  const many = {
    ...parsed.feed,
    minYear: 1955,
    holidays: Object.fromEntries(
      Array.from({ length: 600 }, (_, index) => [`x${index}`, "祝日"]),
    ),
  };
  assert.equal(checkFeed(many, 2026), null);
  assert.match(checkFeed(many, 2028), /今年（2028）を含みません/);
});
