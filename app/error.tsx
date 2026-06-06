"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h1 className="error-title">Something went wrong</h1>
        <p className="error-message">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="error-actions">
          <button onClick={reset} className="error-btn error-btn-primary">
            Try again
          </button>
          <a href="/" className="error-btn error-btn-secondary">
            Go to homepage
          </a>
        </div>
      </div>
    </div>
  );
}