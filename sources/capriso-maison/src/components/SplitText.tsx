import { createElement, type CSSProperties, type ReactNode } from 'react'

type Props = {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
  /** Lines separated by "\n". Wrap a fragment in *asterisks* to set it in italic. */
  text: string
  className?: string
  lineClassName?: string
  style?: CSSProperties
  id?: string
}

function renderItalics(line: string): ReactNode[] {
  return line.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : part,
  )
}

/**
 * Renders text as masked lines (".line-inner" inside ".line-mask") ready for reveal animations.
 * Screen readers get the plain sentence through aria-label.
 */
export function SplitText({ as = 'h2', text, className, lineClassName = '', style, id }: Props) {
  const lines = text.split('\n')
  return createElement(
    as,
    { className, style, id, 'aria-label': text.replace(/\*/g, '').replace(/\n/g, ' ') },
    lines.map((line, i) => (
      <span key={i} className={`line-mask ${lineClassName}`} aria-hidden="true">
        <span className="line-inner">{renderItalics(line)}</span>
      </span>
    )),
  )
}
