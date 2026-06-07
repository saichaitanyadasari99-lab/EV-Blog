"use client"

import { useEffect, useState, useCallback } from "react"

type TocItem = {
  id: string
  text: string
  level: 2 | 3
}

interface Props {
  headings: TocItem[]
}

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState("")
  const [progress, setProgress] = useState(0)

  /* Track active heading via IntersectionObserver */
  useEffect(() => {
    if (typeof window === "undefined" || headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-8% 0% -80% 0%", threshold: 0 }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  /* Track reading progress via scroll */
  const updateProgress = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) return
    setProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)))
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", updateProgress, { passive: true })
    updateProgress()
    return () => window.removeEventListener("scroll", updateProgress)
  }, [updateProgress])

  if (headings.length === 0) return null

  return (
    <div className="toc-inner">
      <span className="toc-panel-label">On This Page</span>

      <nav className="toc-nav" aria-label="Article sections">
        {headings.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`toc-link ${item.level === 3 ? "h3" : "h2"} ${activeId === item.id ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
          >
            {item.text}
          </a>
        ))}
      </nav>

      {/* Reading progress bar */}
      <div className="toc-progress-wrap" aria-hidden="true">
        <div className="toc-progress-bar">
          <div
            className="toc-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="toc-progress-pct">{progress}%</span>
      </div>
    </div>
  )
}
