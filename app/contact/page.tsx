import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — EVPulse Battery Engineering Team",
  description: "Reach out for EV battery consulting, technical reviews, guest articles, or data collaboration on pack performance and charging benchmarks.",
  openGraph: {
    title: "Contact EVPulse — EV Battery Engineering Team",
    description: "Reach out for EV battery consulting, technical reviews, guest articles, or data collaboration.",
  },
};

type Props = {
  searchParams: Promise<{ intent?: string }>;
};

export default async function ContactPage({ searchParams }: Props) {
  const { intent } = await searchParams;

  return (
    <main className="page-main wrapper">
      <section className="page-hero">
        <div className="hero-badge">CONTACT</div>
        <h1 className="page-title">Let&apos;s collaborate</h1>
        <p className="page-subtitle">
          Reach out for EV battery consulting, technical reviews, guest articles, or data collaboration on pack
          performance and charging benchmarks.
        </p>
      </section>

      <section className="info-grid two-up">
        <article className="info-card">
          <h2>Work Inquiries</h2>
          <p>For research assignments, EV benchmarking reports, and engineering support.</p>
          <p className="contact-email">saichaitanyadasari99@gmail.com</p>
        </article>
        <article className="info-card">
          <h2>Publishing and Community</h2>
          <p>Have a dataset, technical note, or correction? Share it for a follow-up post.</p>
          <Link href="/blogs" className="btn-accent" style={{ display: "inline-flex", marginTop: 16 }}>
            Explore Blogs
          </Link>
        </article>
      </section>

      <section className="info-card form-card">
        <h2>Contact Form</h2>
        <p>Fill the details and submit. It will open a prefilled email draft to the admin inbox.</p>
        <ContactForm intent={intent} />
      </section>
    </main>
  );
}
