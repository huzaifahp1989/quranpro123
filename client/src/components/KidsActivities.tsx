import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MatchingPair {
  id: string;
  arabic: string;
  english: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
}

const matchingPairs: MatchingPair[] = [
  { id: "1", arabic: "السلام عليكم", english: "Peace be upon you" },
  { id: "2", arabic: "بسم الله", english: "In the name of Allah" },
  { id: "3", arabic: "الحمد لله", english: "Praise be to Allah" },
  { id: "4", arabic: "ما شاء الله", english: "What Allah has willed" },
  { id: "5", arabic: "إن شاء الله", english: "If Allah wills" }
];

const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "What does 'Bismillah' mean?",
    options: ["In the name of Allah", "Thank you", "Peace", "Goodbye"],
    correct: 0
  },
  {
    id: "q2",
    question: "How many surahs are in the Quran?",
    options: ["100", "114", "120", "150"],
    correct: 1
  },
  {
    id: "q3",
    question: "What is the first surah of the Quran called?",
    options: ["Al-Baqarah", "Al-Fatihah", "Yaseen", "Al-Noor"],
    correct: 1
  },
  {
    id: "q4",
    question: "How many pillars of Islam are there?",
    options: ["3", "4", "5", "6"],
    correct: 2
  }
];

export function KidsActivities() {
  const [activeActivity, setActiveActivity] = useState<string>("matching");
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleMatching = (pairId: string, englishId: string) => {
    setMatchingAnswers(prev => ({
      ...prev,
      [pairId]: englishId
    }));
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const checkMatchingAnswers = () => {
    let correct = 0;
    matchingPairs.forEach((pair, idx) => {
      const selectedId = matchingAnswers[pair.id];
      if (selectedId === pair.id) {
        correct++;
      }
    });
    return { correct, total: matchingPairs.length };
  };

  const checkQuizAnswers = () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct) {
        correct++;
      }
    });
    return { correct, total: quizQuestions.length };
  };

  const resetMatching = () => {
    setMatchingAnswers({});
    setShowResults(false);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setShowResults(false);
  };

  const matchingResults = checkMatchingAnswers();
  const quizResults = checkQuizAnswers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Interactive Activities</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Fun and engaging activities to test your knowledge
        </p>
      </div>

      <Tabs value={activeActivity} onValueChange={setActiveActivity}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="matching" data-testid="tab-matching">
            Matching Game
          </TabsTrigger>
          <TabsTrigger value="quiz" data-testid="tab-quiz">
            Quiz Challenge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matching">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Match Arabic to English</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Connect the Arabic phrases with their English meanings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <div className="space-y-3">
                {matchingPairs.map((pair) => (
                  <div key={pair.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-arabic text-center" dir="rtl">{pair.arabic}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                      <select
                        value={matchingAnswers[pair.id] || ""}
                        onChange={(e) => handleMatching(pair.id, e.target.value)}
                        disabled={showResults}
                        className="px-2 py-1 text-xs sm:text-sm border rounded"
                        data-testid={`matching-select-${pair.id}`}
                      >
                        <option value="">Select...</option>
                        {matchingPairs.map(p => (
                          <option key={p.id} value={p.id}>{p.english}</option>
                        ))}
                      </select>
                      {showResults && (
                        matchingAnswers[pair.id] === pair.id ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {showResults && (
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm sm:text-base font-semibold mb-2">
                    You got {matchingResults.correct} out of {matchingResults.total}!
                  </p>
                  <Button size="sm" variant="outline" onClick={resetMatching} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              )}

              <Button
                onClick={() => setShowResults(!showResults)}
                className="w-full"
                data-testid="button-check-matching"
              >
                {showResults ? "Edit Answers" : "Check Answers"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Islamic Knowledge Quiz</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Test your knowledge of Islam and the Quran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <div className="space-y-4">
                {quizQuestions.map((q) => (
                  <div key={q.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                    <p className="text-sm sm:text-base font-semibold">{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(q.id, idx)}
                          disabled={showResults}
                          className={`w-full text-left p-2 sm:p-3 rounded-lg border transition-all text-xs sm:text-sm
                            ${quizAnswers[q.id] === idx
                              ? 'bg-primary/20 border-primary'
                              : 'hover:bg-muted/50'
                            }
                            ${showResults && idx === q.correct ? 'bg-green-500/20 border-green-500' : ''}
                            ${showResults && quizAnswers[q.id] === idx && idx !== q.correct ? 'bg-red-500/20 border-red-500' : ''}
                          `}
                          data-testid={`quiz-option-${q.id}-${idx}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 border rounded-full text-xs">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {option}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {showResults && (
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm sm:text-base font-semibold mb-2">
                    Score: {quizResults.correct} out of {quizResults.total}
                  </p>
                  <Button size="sm" variant="outline" onClick={resetQuiz} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Retake Quiz
                  </Button>
                </div>
              )}

              <Button
                onClick={() => setShowResults(!showResults)}
                className="w-full"
                data-testid="button-submit-quiz"
              >
                {showResults ? "Edit Answers" : "Submit Quiz"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
