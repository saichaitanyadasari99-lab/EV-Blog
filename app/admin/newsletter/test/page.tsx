"use client";

import Link from "next/link";

export default function AdminTestPage() {
  return (
    <section className="max-w-4xl mx-auto p-6">
      <div className="panel p-6">
        <h1 className="text-2xl font-black">Test Newsletter</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Send a test email to yourself to see how the newsletter looks.
        </p>
      </div>

      <div className="panel p-6 mt-4">
        <p className="mb-4">Click below to send a test email to: <strong>saichaitanyadasari99@gmail.com</strong></p>
        <button
          onClick={async () => {
            const btn = document.getElementById("test-btn") as HTMLButtonElement | null;
            if (btn) {
              btn.textContent = "Sending...";
              btn.disabled = true;
            }
            
            try {
              const res = await fetch("/api/newsletter/test");
              const data = await res.json();
              
              alert(data.success ? "Test email sent! Check your inbox." : "Error: " + JSON.stringify(data.error));
            } catch (err) {
              alert("Error: " + err);
            }
            
            if (btn) {
              btn.textContent = "Send Test Email";
              btn.disabled = false;
            }
          }}
          id="test-btn"
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-white"
        >
          Send Test Email
        </button>
      </div>

      <div className="panel p-6 mt-4">
        <Link href="/admin/newsletter" className="text-[var(--accent)]">
          ← Back to Newsletter
        </Link>
      </div>
    </section>
  );
}