import { useEffect, useState } from 'react';
import { playNotes } from '../lib/audio';
import { ROUND_LENGTH, makeRound, type Question, type QuizId } from '../lib/quiz/questions';
import type { Rng } from '../lib/quiz/random';
import { FRET_COUNT, STANDARD_TUNING, positionMidi, type NeckPosition } from '../lib/theory';
import { Fretboard, type FretboardDot } from './Fretboard';
import './quiz.css';

type Answer = { kind: 'choice'; option: string } | { kind: 'neck'; position: NeckPosition };

interface QuizProps {
  lesson: QuizId;
  rng?: Rng;
}

const same = (a: NeckPosition, b: NeckPosition) => a.string === b.string && a.fret === b.fret;
const storageKey = (lesson: QuizId) => `rum-quiz-${lesson}`;

function readBest(lesson: QuizId): number | null {
  try {
    const saved = Number.parseInt(localStorage.getItem(storageKey(lesson)) ?? '', 10);
    return Number.isNaN(saved) ? null : saved;
  } catch {
    return null;
  }
}

function saveBest(lesson: QuizId, score: number) {
  try {
    localStorage.setItem(storageKey(lesson), String(score));
  } catch {
    return;
  }
}

function isCorrect(question: Question, answer: Answer): boolean {
  if (question.kind === 'choice') return answer.kind === 'choice' && answer.option === question.answer;
  return answer.kind === 'neck' && question.targets.some((target) => same(target, answer.position));
}

function boardDots(question: Question, answer: Answer | null): FretboardDot[] {
  const plain = (dot: NeckPosition & { label: string; degreeNumber: FretboardDot['degreeNumber']; isTonic: boolean }): FretboardDot => ({
    ...dot,
    dimmed: false,
    description: `Струна ${dot.string + 1}, лад ${dot.fret}`,
  });
  const dots = (question.dots ?? []).map(plain);
  if (question.kind !== 'neck' || answer === null) return dots;
  const revealed = question.targets.map((target) => plain({ ...target, label: question.targetLabel, degreeNumber: 3, isTonic: false }));
  const miss = answer.kind === 'neck' && !question.targets.some((target) => same(target, answer.position));
  return [...dots, ...revealed, ...(miss && answer.kind === 'neck' ? [plain({ ...answer.position, label: '×', degreeNumber: null, isTonic: false })] : [])];
}

export function Quiz({ lesson, rng = Math.random }: QuizProps) {
  const [round, setRound] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  const start = () => {
    setRound(makeRound(lesson, rng));
    setIndex(0);
    setAnswer(null);
    setScore(0);
  };

  useEffect(() => {
    start();
    setBest(readBest(lesson));
  }, [lesson]);

  if (round.length === 0) return null;

  const finished = index >= round.length;
  if (finished) {
    return (
      <section className="quiz" aria-label="Проверь себя">
        <h2>Проверь себя</h2>
        <p className="quiz-result" role="status">
          <b>{score} из {round.length}</b>
          {score === round.length ? 'Без ошибок. Можно идти дальше.' : score >= round.length - 2 ? 'Почти. Ещё один круг — и закрепится.' : 'Перечитай урок и попробуй снова: вопросы будут другие.'}
        </p>
        {best !== null && <p className="quiz-meta">Лучший результат: {best} из {ROUND_LENGTH}</p>}
        <button type="button" className="quiz-next" onClick={start}>Ещё раз</button>
      </section>
    );
  }

  const question = round[index]!;
  const correct = answer !== null && isCorrect(question, answer);

  const give = (given: Answer) => {
    if (answer !== null) return;
    setAnswer(given);
    if (isCorrect(question, given)) setScore((current) => current + 1);
  };

  const next = () => {
    const isLast = index === round.length - 1;
    if (isLast && (best === null || score > best)) {
      saveBest(lesson, score);
      setBest(score);
    }
    setIndex(index + 1);
    setAnswer(null);
  };

  const hasBoard = question.kind === 'neck' || question.dots !== undefined;

  return (
    <section className="quiz" aria-label="Проверь себя">
      <div className="quiz-head">
        <h2>Проверь себя</h2>
        <p className="quiz-meta">Вопрос {index + 1} из {round.length} · верно {score}</p>
      </div>
      <div className="quiz-track" aria-hidden="true">
        <span style={{ width: `${((index + (answer ? 1 : 0)) / round.length) * 100}%` }} />
      </div>

      <p className="quiz-prompt" key={index}>{question.prompt}</p>

      {hasBoard && (
        <div className="explorer-board">
          <Fretboard
            dots={boardDots(question, answer)}
            links={question.links}
            stringCount={STANDARD_TUNING.length}
            fretCount={FRET_COUNT}
            ariaLabel="Гриф к вопросу"
            replayKey={`${index}:${answer ? 'answered' : 'open'}`}
            onPositionClick={
              question.kind === 'neck' && answer === null
                ? (string, fret) => {
                    playNotes([positionMidi(string, fret)]);
                    give({ kind: 'neck', position: { string, fret } });
                  }
                : undefined
            }
          />
        </div>
      )}

      {question.kind === 'choice' && (
        <div className="quiz-options" role="group" aria-label="Варианты ответа" key={`options:${index}`}>
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              className="quiz-option"
              disabled={answer !== null}
              data-state={answer === null ? undefined : option === question.answer ? 'correct' : answer.kind === 'choice' && answer.option === option ? 'wrong' : undefined}
              onClick={() => give({ kind: 'choice', option })}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="quiz-feedback" role="status">
        {answer !== null && (
          <>
            <p data-correct={correct ? '' : undefined}>
              <b>{correct ? 'Верно.' : 'Неверно.'}</b> {question.explain}
            </p>
            <button type="button" className="quiz-next" onClick={next}>
              {index === round.length - 1 ? 'Результат' : 'Дальше'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
