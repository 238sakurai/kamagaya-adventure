/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Google Maps Embed API のキー（任意）。ビルド時に埋め込まれる。
   * 設定するときは Google Cloud 側で「HTTP リファラー」を公開 URL に制限すること。
   * 未設定（空文字）のときはストリートビューの埋め込みを出さず、リンクだけになる。
   */
  readonly VITE_GOOGLE_MAPS_EMBED_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
