"use client";

import { useState } from "react";
import { QuizBlock } from "@/components/QuizBlock";

type QuizData = {
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
};

function stripQuizBlocks(html: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < html.length) {
    const idx = html.indexOf('<div class="quiz-block"', i);
    if (idx === -1) {
      result.push(html.slice(i));
      break;
    }
    result.push(html.slice(i, idx));
    let depth = 0;
    let j = idx;
    while (j < html.length) {
      if (html.startsWith("<div", j)) depth++;
      else if (html.startsWith("</div", j)) {
        depth--;
        if (depth === 0) {
          const endClose = html.indexOf(">", j);
          j = endClose + 1;
          break;
        }
      }
      j++;
    }
    i = j;
  }
  return result.join("");
}

export function ArticleContent({ html, quizzes }: { html: string; quizzes: QuizData[] }) {
  const [cleanHtml] = useState(() => stripQuizBlocks(html));

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
