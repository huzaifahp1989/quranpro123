import { useState, useRef, useEffect } from "react";
import { Play, Volume2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Map Arabic letters to audio filenames
const letterAudioMap: { [key: string]: string } = {
  "ا": "alif",
  "ب": "baa",
  "ت": "taa",
  "ث": "thaa",
  "ج": "jeem",
  "ح": "haa",
  "خ": "khaa",
  "د": "dal",
  "ذ": "thal",
  "ر": "raa",
  "ز": "zay",
  "س": "seen",
  "ش": "sheen",
  "ص": "saad",
  "ض": "daad",
  "ط": "taa_h",
  "ظ": "zaa",
  "ع": "ayn",
  "غ": "ghayn",
  "ف": "faa",
  "ق": "qaaf",
  "ك": "kaaf",
  "ل": "laam",
  "م": "meem",
  "ن": "noon",
  "ه": "haa_h",
  "و": "waaw",
  "ي": "yaa",
};

interface Letter {
  arabic: string;
  name: string;
  sound: string;
  positions: {
    isolated: string;
    initial: string;
    medial: string;
    final: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  content: string;
  tips: string[];
  example: string;
  completed?: boolean;
}

const letters: Letter[] = [
  {
    arabic: "ا",
    name: "Alif",
    sound: "A",
    positions: { isolated: "ا", initial: "ا", medial: "ـا", final: "ـا" }
  },
  {
    arabic: "ب",
    name: "Baa",
    sound: "B",
    positions: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" }
  },
  {
    arabic: "ت",
    name: "Taa",
    sound: "T",
    positions: { isolated: "ت", initial: "تـ", medial: "ـتـ", final: "ـت" }
  },
  {
    arabic: "ث",
    name: "Thaa",
    sound: "Th",
    positions: { isolated: "ث", initial: "ثـ", medial: "ـثـ", final: "ـث" }
  },
  {
    arabic: "ج",
    name: "Jeem",
    sound: "J",
    positions: { isolated: "ج", initial: "جـ", medial: "ـجـ", final: "ـج" }
  },
  {
    arabic: "ح",
    name: "Haa (strong)",
    sound: "H",
    positions: { isolated: "ح", initial: "حـ", medial: "ـحـ", final: "ـح" }
  },
  {
    arabic: "خ",
    name: "Khaa",
    sound: "Kh",
    positions: { isolated: "خ", initial: "خـ", medial: "ـخـ", final: "ـخ" }
  },
  {
    arabic: "د",
    name: "Daal",
    sound: "D",
    positions: { isolated: "د", initial: "د", medial: "ـد", final: "ـد" }
  },
  {
    arabic: "ذ",
    name: "Dhaal",
    sound: "Dh",
    positions: { isolated: "ذ", initial: "ذ", medial: "ـذ", final: "ـذ" }
  },
  {
    arabic: "ر",
    name: "Raa",
    sound: "R",
    positions: { isolated: "ر", initial: "ر", medial: "ـر", final: "ـر" }
  },
];

const lessons: Lesson[] = [
  {
    id: "intro",
    title: "Introduction to Qaidah",
    description: "Learn why proper reading technique is important for Quran recitation",
    level: "beginner",
    content: "Qaidah (Foundation) is the science of reading Arabic letters correctly with proper pronunciation and articulation points (Makharij). This foundation is essential for beautiful and accurate Quran recitation.",
    tips: [
      "Take your time - don't rush through the letters",
      "Practice each letter multiple times",
      "Listen carefully to authentic pronunciation",
      "Practice with a teacher when possible"
    ],
    example: "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ"
  },
  {
    id: "letters-intro",
    title: "Arabic Letters & Their Positions",
    description: "Understand how letters change their shape based on position in a word",
    level: "beginner",
    content: "Arabic letters have 4 main positions: Isolated (alone), Initial (at the beginning), Medial (in the middle), and Final (at the end). Each position changes the letter's shape.",
    tips: [
      "Notice how isolated forms are most recognizable",
      "Initial forms connect to letters after them",
      "Medial forms connect both before and after",
      "Final forms connect to letters before them"
    ],
    example: "بـــــب (isolated) - بـ (initial) - ـبـ (medial) - ـب (final)"
  },
  {
    id: "vowels",
    title: "Arabic Vowels & Harakat",
    description: "Learn the three main vowel sounds in Arabic",
    level: "beginner",
    content: "Arabic has three main vowel marks (Harakat): Fatha (َ) = 'A', Kasra (ِ) = 'I', Damma (ُ) = 'U'. These completely change the sound of a word.",
    tips: [
      "Fatha (َ) sounds like 'a' in 'cat'",
      "Kasra (ِ) sounds like 'i' in 'keep'",
      "Damma (ُ) sounds like 'oo' in 'book'",
      "Sukoon (ْ) means no vowel - just the letter"
    ],
    example: "بَ (ba) - بِ (bi) - بُ (bu)"
  },
  {
    id: "makharij",
    title: "Articulation Points (Makharij)",
    description: "Learn where each letter is pronounced from in the mouth and throat",
    level: "intermediate",
    content: "Each Arabic letter has a specific point of articulation (Makharij). Understanding these helps you pronounce letters correctly and recognize subtle differences.",
    tips: [
      "Some letters are from the throat (ع, غ, ح, خ, ء, ه)",
      "Some are from the lips (ب, ف, م)",
      "Some are from the tongue (ر, ل, ن, ت, د, ط, ص, س, ش)",
      "Listen to native speakers to train your ear"
    ],
    example: "Learn to distinguish between: ح and خ, ع and غ, ق and ك"
  },
  {
    id: "tajweed-basics",
    title: "Basic Tajweed Rules",
    description: "Introduction to Quranic recitation rules",
    level: "intermediate",
    content: "Tajweed is the science of reciting the Quran with proper pronunciation. Basic rules include not stopping at verses abruptly and pronouncing each letter clearly.",
    tips: [
      "Learn the rules gradually",
      "Practice with Quranic text",
      "Listen to professional reciters",
      "Repeat until it becomes natural"
    ],
    example: "Practice Surah Al-Fatihah with proper timing and pronunciation"
  },
  {
    id: "noon-tanween",
    title: "Noon & Tanween Rules (Advanced)",
    description: "Master the four rules for pronouncing Noon and Tanween",
    level: "advanced",
    content: "The four rules are: Idhaar (clear), Idghaam (merge), Iqlaab (convert to M), and Ikhfaa (hide). Each applies based on the letter following Noon or Tanween.",
    tips: [
      "Idhaar: With ء ه ع ح غ خ",
      "Idghaam: With ي ر م ل و ن",
      "Iqlaab: Only with ب",
      "Ikhfaa: With remaining 15 letters"
    ],
    example: "مِنْ هَادٍ (Idhaar) vs مَنْ يَعْمَلْ (Idghaam)"
  }
];

export function EnhancedQaidah() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(lessons[0]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(letters[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const markLessonComplete = (lessonId: string) => {
    const newCompleted = new Set(completedLessons);
    newCompleted.add(lessonId);
    setCompletedLessons(newCompleted);
  };

  const playLetterSound = (letter: string) => {
    try {
      // First try to play from audio files
      const audioFilename = letterAudioMap[letter];
      if (audioFilename && audioRef.current) {
        const audioUrl = `/audio/letters/${audioFilename}.mp3`;
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(error => {
          console.log('Audio file not found, trying speech synthesis:', error);
          playWithSpeechSynthesis(letter);
        });
      } else {
        // Fallback to speech synthesis
        playWithSpeechSynthesis(letter);
      }
    } catch (error) {
      console.error('Error:', error);
      playWithSpeechSynthesis(letter);
    }
  };

  const playWithSpeechSynthesis = (letter: string) => {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not available');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in speech synthesis:', error);
    }
  };

  const progress = (completedLessons.size / lessons.length) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Learn Qaidah - Master Quran Reading</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          Structured lessons to improve your Quranic recitation from beginner to advanced
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Your Progress</span>
            <span className="font-semibold">{completedLessons.size} of {lessons.length} lessons</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="lessons" data-testid="tab-lessons" className="text-xs sm:text-sm">
            Lessons
          </TabsTrigger>
          <TabsTrigger value="letters" data-testid="tab-letters" className="text-xs sm:text-sm">
            Letters
          </TabsTrigger>
          <TabsTrigger value="practice" data-testid="tab-practice" className="text-xs sm:text-sm">
            Practice
          </TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lessons List */}
            <div className="sm:col-span-1 space-y-2">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className={`hover-elevate cursor-pointer transition-all p-3 sm:p-4 ${
                    selectedLesson?.id === lesson.id ? 'bg-primary/5 border-primary' : ''
                  }`}
                  onClick={() => setSelectedLesson(lesson)}
                  data-testid={`lesson-${lesson.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-semibold truncate">{lesson.title}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{lesson.level}</p>
                    </div>
                    {completedLessons.has(lesson.id) && (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Lesson Content */}
            {selectedLesson && (
              <Card className="sm:col-span-2 hover-elevate">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">{selectedLesson.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{selectedLesson.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-6">
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                      {selectedLesson.content}
                    </p>

                    {selectedLesson.example && (
                      <div className="bg-primary/5 p-3 sm:p-4 rounded-lg mb-4">
                        <p className="text-xs sm:text-sm font-medium mb-2">Example:</p>
                        <p className="text-lg sm:text-2xl font-arabic text-center" dir="rtl">
                          {selectedLesson.example}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-2">Key Tips:</p>
                      <ul className="space-y-1">
                        {selectedLesson.tips.map((tip, idx) => (
                          <li key={idx} className="flex gap-2 text-xs sm:text-sm">
                            <span className="text-primary shrink-0">•</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {!completedLessons.has(selectedLesson.id) && (
                    <Button
                      onClick={() => markLessonComplete(selectedLesson.id)}
                      className="w-full"
                      data-testid={`button-complete-${selectedLesson.id}`}
                    >
                      Mark as Complete
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Letters Tab */}
        <TabsContent value="letters" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Letters Grid */}
            <div className="sm:col-span-1">
              <div className="grid grid-cols-3 gap-2">
                {letters.map((letter, idx) => (
                  <Card
                    key={idx}
                    className={`hover-elevate active-elevate-2 cursor-pointer p-3 text-center transition-all ${
                      selectedLetter?.arabic === letter.arabic ? 'bg-primary/5 border-primary' : ''
                    }`}
                    onClick={() => setSelectedLetter(letter)}
                    data-testid={`letter-card-${letter.name}`}
                  >
                    <p className="text-3xl sm:text-4xl font-arabic leading-none mb-2">{letter.arabic}</p>
                    <p className="text-xs font-medium">{letter.name}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Letter Details */}
            {selectedLetter && (
              <Card className="sm:col-span-2 hover-elevate">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-4xl sm:text-5xl font-arabic">{selectedLetter.arabic}</span>
                    <span className="text-lg sm:text-2xl">{selectedLetter.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-6">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium mb-2">Pronunciation Sound:</p>
                    <p className="text-base sm:text-lg mb-3">{selectedLetter.sound}</p>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => playLetterSound(selectedLetter.arabic)}
                      data-testid={`button-play-${selectedLetter.name}`}
                    >
                      <Volume2 className="w-4 h-4" />
                      Hear Letter Sound
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium mb-3">Letter Positions:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-muted/30 rounded">
                        <p className="text-2xl sm:text-3xl font-arabic mb-1">{selectedLetter.positions.isolated}</p>
                        <p className="text-xs">Isolated</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded">
                        <p className="text-2xl sm:text-3xl font-arabic mb-1">{selectedLetter.positions.initial}</p>
                        <p className="text-xs">Initial</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded">
                        <p className="text-2xl sm:text-3xl font-arabic mb-1">{selectedLetter.positions.medial}</p>
                        <p className="text-xs">Medial</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded">
                        <p className="text-2xl sm:text-3xl font-arabic mb-1">{selectedLetter.positions.final}</p>
                        <p className="text-xs">Final</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Practice Tab */}
        <TabsContent value="practice">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Daily Practice</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Practice exercises to strengthen your Qaidah skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-3 sm:p-6">
              <div className="space-y-3">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h3 className="font-semibold text-sm sm:text-base mb-3">Practice Exercise 1: Letter Recognition</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Read these words and identify the letters and their positions:
                  </p>
                  <div className="space-y-2">
                    {["الحمد", "بسم", "يعمل", "رزق", "نور"].map((word, idx) => (
                      <div key={idx} className="p-3 bg-background rounded border">
                        <p className="text-lg sm:text-2xl font-arabic text-center" dir="rtl">{word}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg">
                  <h3 className="font-semibold text-sm sm:text-base mb-3">Practice Exercise 2: Vowel Recognition</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Identify the vowel (Fatha َ, Kasra ِ, or Damma ُ) in each syllable:
                  </p>
                  <div className="space-y-2">
                    {["بَ", "دِ", "نُ", "قَ", "سِ"].map((syllable, idx) => (
                      <div key={idx} className="p-3 bg-background rounded border text-center">
                        <p className="text-2xl sm:text-3xl font-arabic">{syllable}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button className="w-full gap-2" data-testid="button-start-practice">
                <Play className="w-4 h-4" />
                Start Interactive Practice
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
