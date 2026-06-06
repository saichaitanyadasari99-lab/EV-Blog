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

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 0,
          padding: "0 20px",
        }}
        className="lg:grid-cols-[240px_1fr] lg:gap-8 lg:padding-0"
      >
        <aside
          className="hidden lg:block"
          style={{
            position: "sticky",
            top: "80px",
            maxHeight: "calc(100vh - 5rem)",
            overflowY: "auto",
          }}
        >
          <TableOfContents
            headings={headings}
            date={date}
            readingTime={readingTime}
            level={level}
          />
        </aside>

        <main
          id="article-body"
          style={{
            minWidth: 0,
            maxWidth: "768px",
          }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
