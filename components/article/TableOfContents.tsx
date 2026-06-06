"use client"

import { useEffect, useState } from "react"

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
}

export function TableOfContents({ headings, date, readingTime, level }: Props) {
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
    if (typeof window === "undefined" || headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-10% 0% -80% 0%", threshold: 0 }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Article sections">
      <div className="toc-label">In this article</div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {headings.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`toc-item ${activeId === item.id ? "active" : ""}`}
              style={{
                paddingLeft: item.level === 3 ? "20px" : "12px",
              }}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>

      {date && (
        <div className="toc-divider" />
      )}

      {date && (
        <div>
          <div className="toc-meta">{date}</div>
          {readingTime && <div className="toc-meta">{readingTime} min read</div>}
          {level && <div className="toc-meta" style={{ color: "var(--brand)" }}>{level}</div>}
        </div>
      )}
    </nav>
  )
}
