// 内閣府の祝日 CSV（1 行目が見出し、以降「1955/1/1,元日」）を、配信する JSON の形に直す。
// 依存パッケージは使わない。

export const CSV_URL = "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv";

export const FEED_KIND = "jp-holidays";

export const FEED_VERSION = 1;

function isoDate(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Shift_JIS のバイト列を文字列にする。UTF-8 として読めればそのまま使う。
export function decodeCsv(bytes) {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  return utf8.includes("�") ? new TextDecoder("shift_jis").decode(bytes) : utf8;
}

// 成功なら { ok: true, feed }、失敗なら { ok: false, error }。
export function parseHolidayCsv(text, source = CSV_URL) {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  if (lines.length < 2) {
    return { ok: false, error: "祝日の行がありません" };
  }
  const entries = [];
  for (const [index, line] of lines.slice(1).entries()) {
    const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2}),(.+)$/.exec(line);
    if (!match) {
      return { ok: false, error: `${index + 2} 行目を読めません: ${line}` };
    }
    const [, year, month, day, name] = match;
    const date = isoDate(Number(year), Number(month), Number(day));
    const check = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(check.getTime()) || check.toISOString().slice(0, 10) !== date) {
      return { ok: false, error: `${index + 2} 行目の日付が正しくありません: ${line}` };
    }
    entries.push([date, name.trim()]);
  }
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const years = entries.map(([date]) => Number(date.slice(0, 4)));
  return {
    ok: true,
    feed: {
      kind: FEED_KIND,
      version: FEED_VERSION,
      source,
      minYear: Math.min(...years),
      maxYear: Math.max(...years),
      holidays: Object.fromEntries(entries),
    },
  };
}

// 取得に失敗して空や途中までのデータで置き換えないよう、量と範囲を確かめる。
export function checkFeed(feed, thisYear) {
  const count = Object.keys(feed.holidays).length;
  if (count < 500 || feed.maxYear < thisYear) {
    return `祝日が少なすぎるか、今年（${thisYear}）を含みません: ${count} 件、${feed.minYear}〜${feed.maxYear} 年`;
  }
  return null;
}
