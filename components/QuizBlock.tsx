"use client";

import { useState } from "react";

type QuizProps = {
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
};

export function QuizBlock({ question, answers, correct, explanation }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setShowFeedback(true);
  };

  const letters = ["A", "B", "C", "D"];
  const isCorrect = selected === correct;

  return (
    <div className="quiz-block">
      <p className="quiz-question">{question}</p>
      <div className="quiz-options">
        {answers.map((answer, idx) => (
          <button
            key={idx}
            type="button"
            className={`quiz-option ${
              selected !== null
                ? idx === correct
                  ? "correct"
                  : idx === selected
                  ? "incorrect"
                  : "disabled"
                : ""
            }`}
            onClick={() => handleSelect(idx)}
          >
            <span className="quiz-letter">{letters[idx]}</span>
            <span>{answer}</span>
          </button>
        ))}
      </div>
      {showFeedback && (
        <div className={`quiz-feedback ${isCorrect ? "show-correct" : "show-incorrect"}`}>
          <strong>{isCorrect ? "Correct! " : "Not quite. "}</strong>
          {explanation}
        </div>
      )}
    </div>
  );
}
