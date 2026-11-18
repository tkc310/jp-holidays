# jp-holidays

日本の祝日（国民の祝日・休日）を JSON で配信します。内閣府が公表している CSV を、GitHub Actions が毎年取得して変換し、GitHub Pages で公開します。

## 使い方

```
https://tkc310.github.io/jp-holidays/holidays.json
```

```json
{
  "kind": "jp-holidays",
  "version": 1,
  "source": "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv",
  "minYear": 1955,
  "maxYear": 2027,
  "holidays": {
    "1955-01-01": "元日",
    "…": "…"
  }
}
```

| 項目                  | 内容                                                          |
| --------------------- | ------------------------------------------------------------- |
| `kind` / `version`    | データの目印と版。形を変えるときは `version` を上げる         |
| `source`              | 取得元の CSV                                                  |
| `minYear` / `maxYear` | 収録している最初と最後の年                                    |
| `holidays`            | `YYYY-MM-DD` → 名称。日付順。振替休日は「休日」として載っている |

UTF-8 に直した CSV（`syukujitsu.csv`）も同じ場所に置いています。

## 更新

- `.github/workflows/update.yml` が毎年 3 月 1 日 9:00（JST）に動きます。内閣府は翌年の祝日を毎年 2 月に掲載するためです
- 変わりがあれば `main` にコミットし、GitHub Pages に反映されます
- Actions の「Update」から手で動かすこともできます
- 手元では `npm run update`（ネットワークを使わずに手元の CSV から作るなら `npm run update -- --from <ファイル>`）

公開リポジトリでは、60 日間コミットなどの動きがないと GitHub がスケジュール実行を止めます。止まったら Actions の画面で有効にし直してください。

## 出典

祝日データの出典は内閣府ホームページ「国民の祝日について」（<https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html>）です。e-Gov データポータルにも同じデータが掲載されています。このリポジトリでは文字コードと形を変えて配信しています。

## ライセンス

コードは MIT License です。祝日データの利用条件は出典の利用規約に従ってください。
