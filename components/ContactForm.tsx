"use client";

import { useMemo, useState } from "react";

type Props = {
  intent?: string;
};

export function ContactForm({ intent }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(
    intent === "subscribe" ? "Newsletter subscription request" : "",
  );
  const [message, setMessage] = useState(
    intent === "subscribe"
      ? "Please add me to the VoltPulse newsletter list."
      : "",
  );
  const [status, setStatus] = useState("");

  const buttonLabel = useMemo(
    () => (intent === "subscribe" ? "Subscribe via Email" : "Send Inquiry"),
    [intent],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus("Please fill all fields before submitting.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setStatus("Please enter a valid email address.");
      return;
    }

    void (async () => {
      setStatus("Submitting...");
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          intent: intent ?? "contact",
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Submission failed.");
        return;
      }

      setStatus(
        intent === "subscribe"
          ? "Subscribed successfully. Your email is saved in Supabase."
          : "Inquiry submitted. Details are saved in Supabase.",
      );
      setName("");
      setEmail("");
      setSubject(intent === "subscribe" ? "Newsletter subscription request" : "");
      setMessage(intent === "subscribe" ? "Please add me to the VoltPulse newsletter list." : "");
    })();
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} id="contact-form">
      <input
        className="field-input"
        placeholder="Your Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input
        className="field-input"
        placeholder="Your Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        className="field-input span-2"
        placeholder="Subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <textarea
        className="field-input span-2"
        placeholder="Tell me about your project..."
        rows={6}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button type="submit" className="btn-accent span-2" style={{ width: "fit-content" }}>
        {buttonLabel}
      </button>
      {status ? <p className="form-status span-2">{status}</p> : null}
    </form>
  );
}
