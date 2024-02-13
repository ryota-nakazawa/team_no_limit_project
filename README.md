# Team NO LIMIT アイドルプロジェクト用リポジトリ

## アプリデプロイ先
[アイドルチャットアプリ](https://team-no-limit-project.vercel.app/)

## 環境設定手順

各々のPCで環境設定をして動かしてみてください。
（Git cloneでプロジェクトをローカルに下ろしてきている前提です。）

### `①node.jsインストール`

[Qiita](https://qiita.com/sefoo0104/items/0653c935ea4a4db9dc2b)とか参考にしてください。

### `②create-react-app の実行`

$ npx create-react-app teama-project

### `③プロジェクトフォルダに移動`

$ cd teama-project

### `④アイコンインストール`

$ npm install react-icons

### `⑤.envの作成とChatGpt APIのKeyの設定`

rootディレクトリに.envファイルを作る。

その後、.envに自分で取得したAPIキーを設定する。（gitignnoreに.envを記載しているので、キーがバレることはありません）
REACT_APP_OPENAI_API_KEY="Your API KEY"

### `⑥アプリケーションの起動で実際に動かす`

$ npm start

※ 他にも不足事項あれば記載よろ

※ モバイルは現状、Androidのみ対応可能
