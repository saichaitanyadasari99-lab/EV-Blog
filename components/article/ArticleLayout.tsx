import { TableOfContents } from "./TableOfContents"
import { LeftSidebar } from "./LeftSidebar"
import "@/styles/article-layout.css"

type TocItem = {
  id: string
  text: string
  level: 2 | 3
}

interface Props {
  headings: TocItem[]
  tier?: string | null
  tags?: string[]
  children: React.ReactNode
}

export function ArticleLayout({ headings, tier, tags, children }: Props) {
  return (
    <div className="article-page-outer">
      <div className="article-3col">
        {/* Left sidebar — share, difficulty, prerequisites */}
        <aside className="aside-left" aria-label="Article sidebar">
          <LeftSidebar tier={tier} tags={tags} />
        </aside>

        {/* Main article content */}
        <main id="article-body" className="article-main">
          {children}
        </main>

        {/* Right TOC */}
        <aside className="aside-toc" aria-label="Table of contents">
          <TableOfContents headings={headings} />
        </aside>
      </div>
    </div>
  )
}
