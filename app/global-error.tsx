"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <div className="error-container">
          <div className="error-content">
            <h1>Application Error</h1>
            <p>{error.message || "Critical error occurred"}</p>
            <button onClick={reset}>Reload</button>
          </div>
        </div>
      </body>
    </html>
  );
}