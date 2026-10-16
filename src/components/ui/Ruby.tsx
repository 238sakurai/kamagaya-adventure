interface RubyProps {
  text: string
  kana?: string
  className?: string
}

/** ふりがな付きテキスト。kana が無ければそのまま表示 */
export function Ruby({ text, kana, className = '' }: RubyProps) {
  if (!kana) return <span className={className}>{text}</span>
  return (
    <ruby className={className}>
      {text}
      <rp>（</rp>
      <rt>{kana}</rt>
      <rp>）</rp>
    </ruby>
  )
}
