import { createElement, type CSSProperties, type ReactNode } from 'react'

type Props = {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
  /** Lines separated by "\n". Wrap a fragment in *asterisks* to set it in italic. */
  text: string
  className?: string
  lineClassName?: string
  style?: CSSProperties
  id?: string
  /** Split each word into characters (for per-letter animation). Default: true. */
  chars?: boolean
}

function splitWords(fragment: string, chars: boolean, keyBase: string): ReactNode[] {
  if (!chars) return [fragment]
  const out: ReactNode[] = []
  fragment.split(/(\s+)/).forEach((word, wi) => {
    if (!word) return
    if (/^\s+$/.test(word)) {
      out.push(' ')
      return
    }
    out.push(
      <span key={`${keyBase}-${wi}`} className="word">
        {Array.from(word).map((c, ci) => (
          <span key={ci} className="char">
            {c}
          </span>
        ))}
      </span>,
    )
  })
  return out
}

function renderLine(line: string, chars: boolean, li: number): ReactNode[] {
  return line.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <em key={i}>{splitWords(part.slice(1, -1), chars, `${li}-${i}`)}</em>
    ) : (
      <span key={i}>{splitWords(part, chars, `${li}-${i}`)}</span>
    ),
  )
}

/**
 * Renders text as masked lines (".line-inner" inside ".line-mask"), optionally split into
 * ".word > .char" spans, ready for reveal animations. Screen readers get the plain sentence.
 */
export function SplitText({ as = 'h2', text, className, lineClassName = '', style, id, chars = true }: Props) {
  const lines = text.split('\n')
  return createElement(
    as,
    { className, style, id, 'aria-label': text.replace(/\*/g, '').replace(/\n/g, ' ') },
    lines.map((line, i) => (
      <span key={i} className={`line-mask ${lineClassName}`} aria-hidden="true">
        <span className="line-inner">{renderLine(line, chars, i)}</span>
      </span>
    )),
  )
}
