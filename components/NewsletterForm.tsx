"use client";

import { useState } from "react";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Newsletter Subscriber",
          email: email.trim(),
          subject: "Newsletter Subscription",
          message: "Subscribed via homepage form",
          intent: "subscribe",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing!");
        setEmail("");
        setName("");
      } else {
        // Handle duplicate email error specifically
        if (res.status === 409) {
          setStatus("error");
          setMessage(data.error || "This email has already been registered.");
        } else {
          setStatus("error");
          setMessage(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "loading" || status === "success"}
          style={{
            background: "var(--surface3)",
            border: "1px solid var(--border2)",
            borderRadius: "8px",
            color: "var(--text)",
            fontSize: "13px",
            height: "36px",
            padding: "0 12px",
            width: "100%",
          }}
        />
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "success"}
          style={{
            background: "var(--surface3)",
            border: "1px solid var(--border2)",
            borderRadius: "8px",
            color: "var(--text)",
            fontSize: "13px",
            height: "36px",
            padding: "0 12px",
            width: "100%",
          }}
        />
        <button 
          type="submit" 
          disabled={status === "loading" || status === "success"}
          style={{
            background: "var(--accent)",
            border: "none",
            borderRadius: "8px",
            color: "#000",
            cursor: "pointer",
            fontFamily: "var(--font-ibm-mono)",
            fontSize: "12px",
            fontWeight: 700,
            height: "36px",
            letterSpacing: "0.6px",
            padding: "0 16px",
          }}
        >
          {status === "loading" ? "..." : status === "success" ? "Done" : "Subscribe"}
        </button>
        {message && (
          <span style={{ color: status === "error" ? "var(--red)" : "var(--green)", fontSize: "12px" }}>
            {message}
          </span>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={status === "loading" || status === "success"}
        style={{
          background: "var(--surface3)",
          border: "1px solid var(--border2)",
          borderRadius: "8px",
          color: "var(--text)",
          fontSize: "13px",
          height: "40px",
          padding: "0 14px",
          width: "140px",
        }}
      />
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading" || status === "success"}
        style={{
          background: "var(--surface3)",
          border: "1px solid var(--border2)",
          borderRadius: "8px",
          color: "var(--text)",
          fontSize: "13px",
          height: "40px",
          padding: "0 14px",
          width: "200px",
        }}
      />
      <button 
        type="submit" 
        disabled={status === "loading" || status === "success"}
        style={{
          background: "var(--accent)",
          border: "none",
          borderRadius: "8px",
          color: "#000",
          cursor: "pointer",
          fontFamily: "var(--font-ibm-mono)",
          fontSize: "12px",
          fontWeight: 700,
          height: "40px",
          letterSpacing: "0.6px",
          padding: "0 20px",
          whiteSpace: "nowrap",
        }}
      >
        {status === "loading" ? "..." : status === "success" ? "Done" : "Subscribe ->"}
      </button>
      {message && (
        <span style={{ color: status === "error" ? "var(--red)" : "var(--green)", fontSize: "12px", whiteSpace: "nowrap" }}>
          {message}
        </span>
      )}
    </form>
  );
}
