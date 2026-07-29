# Englishstudy

英語のリスニング学習サイト。すべての処理を利用者の端末の中で行い、音声を外に出さない。

設計の経緯と検証結果は [`docs/DECISIONS.md`](docs/DECISIONS.md) にまとめてある。
**作業を始める前にまずそこを読むこと。**

---

## 構成

```
/
├─ index.html          入口
├─ listening/          リスニング（これ単体で完結して動く）
│   └─ index.html
├─ assets/             共通のCSSとJS
├─ docs/               設計の記録
└─ tools/              検証用のスクリプト（サイトには含めない）
```

ビルドは行わない。素のHTMLとESモジュールだけで動かす。
理由は `docs/DECISIONS.md` を参照（学校のネットや古い端末で確実に動かすため）。

---

## 手元で動かす

ファイルを直接開く（`file:///...`）と、ブラウザによっては
外部からのモジュール読み込みが遮断される。簡易サーバー経由で開くこと。

```powershell
cd C:\Users\syuhe\Desktop\Englishstudy
python -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開く。

---

## 公開する

GitHub に push すると Cloudflare Pages が自動で公開する。

```powershell
git add .
git commit -m "変更の内容"
git push
```

### 最初の一回だけ必要な設定

1. このフォルダで `git init`、GitHub にリポジトリを作って `git remote add origin ...`
2. Cloudflare のダッシュボード → Workers & Pages → Pages → Git に接続
3. リポジトリを選ぶ。ビルド設定は**なし**（フレームワーク：None、
   ビルドコマンド：空、出力ディレクトリ：`/`）

以降は push するだけで公開される。壊れたら Cloudflare の画面から前のデプロイに戻せる。

---

## 気をつけること

- **音声ファイルをリポジトリに入れない。** 著作権の線を越える
- 個人情報や鍵をコミットしない
- 大きな変更の前に、動いている状態で一度コミットしておく
