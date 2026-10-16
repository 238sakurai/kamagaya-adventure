import { useApp } from '../app/AppContext'
import { ExternalLink } from '../components/ui/ExternalLink'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { CHARACTER } from '../config/character'
import { DISTRICT_SOURCE } from '../data/districts'
import { ENROLLMENT_SOURCE, SCHOOL_DISTRICT_URL } from '../data/schools'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-3xl bg-white p-4 shadow-card">
    <h2 className="text-base font-black">{title}</h2>
    <div className="mt-1 space-y-1 text-sm leading-relaxed">{children}</div>
  </section>
)

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <ExternalLink href={href} className="font-bold text-sky-dark underline">
    {children} ↗
  </ExternalLink>
)

export function AboutScreen({ onBack }: { onBack: () => void }) {
  const { geo } = useApp()
  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3 pb-6" data-testid="about-screen">
      <ScreenHeader title="このゲームについて" onBack={onBack} />
      <Section title="かまたんの かまがや大冒険！">
        <p>鎌ケ谷市の学校・町名・図書館・児童センターを、地図で遊びながら覚える学習ゲームです。</p>
        <p className="font-bold">このゲームは鎌ケ谷市の公式事業ではありません。個人が制作した非公式の地域学習ゲームです。</p>
      </Section>
      <Section title="地図データの出典">
        {geo?.sources.map((s) => (
          <p key={s.url}>
            <Link href={s.url}>{s.name}</Link>（{s.provider}、{s.license}）を加工して作成。{s.note}
          </p>
        ))}
        <p className="text-xs text-ink-soft">町名の区域は統計上の小地域で、住居表示や通学区域の境界とは一致しません。</p>
      </Section>
      <Section title="学校・施設・町名の出典">
        <p>
          学校: <Link href="https://www.city.kamagaya.chiba.jp/sisetsu/shougakou/index.html">鎌ケ谷市 施設案内（小学校）</Link>、<Link href="https://www.city.kamagaya.chiba.jp/sisetsu/chuugakou/index.html">同（中学校）</Link>、各校の公式ホームページ、<Link href={ENROLLMENT_SOURCE}>令和8年度 児童生徒数一覧</Link>
        </p>
        <p>
          学校の位置: <Link href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P29-2023.html">国土数値情報 学校データ（P29、令和5年度）</Link>
        </p>
        <p>
          図書館: <Link href="https://www.library-kamagaya-chiba.jp/toshow/html/access.html">鎌ケ谷市立図書館 施設案内</Link>／ 児童センター: <Link href="https://www.city.kamagaya.chiba.jp/sisetsu/jidoucenter/index.html">鎌ケ谷市 施設案内（児童センター）</Link>
        </p>
        <p>
          施設の位置: 国土地理院 地名検索（住所検索）および鎌ケ谷市 施設案内マップ ／ 町名: {DISTRICT_SOURCE.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && '、'}
              <Link href={s.url}>{s.title}</Link>
            </span>
          ))}
        </p>
        <p className="text-xs text-ink-soft">各項目の確認日は図鑑の詳細に表示しています（{DISTRICT_SOURCE.verifiedAt} 時点）。</p>
      </Section>
      <Section title="通学区域について">
        <p>
          ゲーム内の情報は学習用です。町名と通学区域は同じではなく、同じ町名でも番地によって学校が異なります。正式な通学区域・指定校は <Link href={SCHOOL_DISTRICT_URL}>鎌ケ谷市教育委員会の案内</Link> で確認してください。
        </p>
      </Section>
      <Section title={`${CHARACTER.name}について`}>
        <p>
          「かまたん」は鎌ケ谷市のマスコットキャラクターです。公式のイラスト・画像を使うには市の使用承認が必要なため、{CHARACTER.officialImageApproved ? '承認を得た画像を使用しています。' : '現在は公式画像を使用せず、汎用の案内アイコンを表示しています。'}
          <Link href="https://www.city.kamagaya.chiba.jp/kamatan/request/index.html">デザイン使用について（市公式）</Link>
        </p>
      </Section>
      <Section title="プライバシー">
        <p>名前・住所・位置情報などの個人情報は収集しません。ハイスコアや図鑑の進み具合、設定は、この端末のブラウザ（localStorage）の中だけに保存され、外部には送信されません。アクセス解析ツールも使っていません。</p>
      </Section>
      <Section title="省電力の工夫">
        <p>地図は SVG で描き、操作していないときは再描画しません。演出は短時間で終わり、タブを閉じるとタイマーも止まります。設定の「省電力モード」で演出をさらに減らせます。</p>
      </Section>
    </div>
  )
}
