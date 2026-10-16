import type { ReactNode } from 'react'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  className?: string
  'data-testid'?: string
}

/** 外部サイトは新しいタブで開く（ゲームの状態を失わないため） */
export function ExternalLink({ href, children, className = '', ...rest }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`focus-ring underline-offset-2 ${className}`} {...rest}>
      {children}
    </a>
  )
}

/** 公式サイトを開く大きなボタン */
export function OfficialSiteButton({ href, label = '公式サイトをみる', ...rest }: { href: string; label?: string; 'data-testid'?: string }) {
  return (
    <ExternalLink
      href={href}
      className="btn-pop inline-flex min-h-12 items-center justify-center gap-2 rounded-3xl bg-sky px-5 text-base font-bold text-ink no-underline"
      {...rest}
    >
      <span aria-hidden="true">🌐</span>
      {label}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">（新しいタブで開きます）</span>
    </ExternalLink>
  )
}
