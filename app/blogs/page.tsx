import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import type { PostRecord } from "@/types/post";

type SectionSpec = {
  title: string;
  keyword: string;
  category: PostRecord["category"];
  tag?: string;
};

const sections: SectionSpec[] = [
  { title: "Cell Chemistry", keyword: "Keywords: DCIR, OCV-SOC, silicon anode, calendar aging", category: "post" },
  { title: "Pack and BMS Design", keyword: "Keywords: EKF, balancing, ISO 26262, runaway detection", category: "deep-dive" },
  { title: "EV Benchmarks", keyword: "Keywords: charging taper, winter range, regen efficiency", category: "benchmark" },
  {
    title: "Vehicle Reviews",
    keyword: "Keywords: real-world range, thermal behavior, long-term efficiency",
    category: "review",
    tag: "section-review",
  },
  {
    title: "Standards and Compliance",
    keyword: "Keywords: UN ECE R100, UL 2580, ISO 15118, IEC 61851",
    category: "standards",
    tag: "section-standards",
  },
];

export default async function BlogsPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="page-main wrapper">
      <section className="page-hero page-hero-center">
        <div className="hero-badge">BLOGS</div>
        <h1 className="page-title">All Published Articles</h1>
        <p className="page-subtitle">A complete archive of EV battery research notes, benchmarks, and explainers.</p>
      </section>

      {sections.map((section) => {
        const categoryPosts = posts
          .filter(
            (post) =>
              post.category === section.category ||
              (section.tag ? (post.tags ?? []).includes(section.tag) : false),
          )
          .slice(0, 5);

        return (
          <section key={section.title} className="section-block">
            <div className="sec-head">
              <h2 className="sec-title">{section.title} ({categoryPosts.length})</h2>
            </div>
            <p className="section-keywords">{section.keyword}</p>
            <div className="articles-grid five-grid">
              {categoryPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
