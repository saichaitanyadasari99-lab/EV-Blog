import { ReadingProgress } from "./ReadingProgress"
import { TableOfContents } from "./TableOfContents"

type TocItem = {
  id: string
  text: string
  level: 2 | 3
}

interface Props {
  headings: TocItem[]
  date?: string
  readingTime?: number
  level?: string
  children: React.ReactNode
}

export function ArticleLayout({ headings, date, readingTime, level, children }: Props) {
  return (
    <>
      <ReadingProgress />

      <div className="article-layout-shell">
        {/* Sidebar — hidden below lg breakpoint */}
        <aside className="article-sidebar">
          <TableOfContents
            headings={headings}
            date={date}
            readingTime={readingTime}
            level={level}
          />
        </aside>

        {/* Main content */}
        <main id="article-body" className="article-main">
          {children}
        </main>
      </div>
    </>
  )
}
