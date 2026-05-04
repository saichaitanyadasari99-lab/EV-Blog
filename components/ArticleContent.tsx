"use client";

import { useState } from "react";
import { QuizBlock } from "@/components/QuizBlock";

type QuizData = {
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
};

export function ArticleContent({ html, quizzes }: { html: string; quizzes: QuizData[] }) {
  // Strip quiz placeholder divs from HTML since we render them as React components
  const [cleanHtml] = useState(() => {
    return html.replace(/<div class="quiz-block"[^>]*>[\s\S]*?<\/div>/g, "");
  });

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      {quizzes.map((quiz, idx) => (
        <QuizBlock
          key={idx}
          question={quiz.question}
          answers={quiz.answers}
          correct={quiz.correct}
          explanation={quiz.explanation}
        />
      ))}
    </>
  );
}
