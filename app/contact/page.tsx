import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="shell py-8">
      <header className="panel p-8 md:p-10">
        <div className="chip">Contact</div>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">Let&apos;s Collaborate</h1>
        <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
          Reach out for EV battery consulting, technical reviews, guest articles, or
          data collaboration on pack performance and charging benchmarks.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Work Inquiries</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            For research assignments, EV benchmarking reports, and engineering support.
          </p>
          <p className="mt-4 font-semibold text-[var(--accent)]">
            saichaitanyadasari99@gmail.com
          </p>
        </article>
        <article className="panel p-6">
          <h2 className="text-xl font-bold">Publishing and Community</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Have a dataset, technical note, or correction? Share it for a follow-up
            post.
          </p>
          <div className="mt-4">
            <Link
              href="/blogs"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              Explore Blogs
            </Link>
          </div>
        </article>
      </section>

      <section className="panel mt-6 p-6 md:p-8">
        <h2 className="text-xl font-bold">Contact Form</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Use this form layout as your public inquiry channel. Connect it later to
          Formspree or a server route.
        </p>
        <form className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Your Name"
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Your Email"
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 md:col-span-2"
            placeholder="Subject"
          />
          <textarea
            className="min-h-[140px] rounded-lg border border-[var(--border)] bg-white px-3 py-2 md:col-span-2"
            placeholder="Tell me about your project..."
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white hover:bg-[var(--accent-strong)] md:col-span-2 md:w-fit"
          >
            Send Inquiry
          </button>
        </form>
      </section>
    </main>
  );
}
