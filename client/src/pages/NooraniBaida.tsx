import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Volume2, BookOpen } from "lucide-react";

const nooraaniContent = {
  intro: "Noorani Qaida is the foundation for learning to read the Quran with proper pronunciation and rules.",
  lessons: [
    {
      title: "Lesson 1: The 28 Arabic Letters (Alif Baa)",
      content: `
ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي

Alif - Baa - Taa - Thaa - Jeem - Haa - Khaa - Dal - Thal - Raa - Zay
Seen - Sheen - Saad - Daad - Taa - Zaa - Ain - Ghain - Faa - Qaaf - Kaaf
Lam - Meem - Noon - Haa - Waw - Yaa

Each letter has 4 forms:
• Beginning of word
• Middle of word  
• End of word
• Standalone
      `
    },
    {
      title: "Lesson 2: Short Vowels (Harakaat)",
      content: `
1. FATHA (َ) - sounds like 'a' in "cat"
   بَ (ba) - pronounced "bah"

2. DAMMA (ُ) - sounds like 'u' in "put"
   بُ (bu) - pronounced "boo"

3. KASRA (ِ) - sounds like 'i' in "sit"
   بِ (bi) - pronounced "bee"

4. SUKUN (ْ) - no vowel sound
   بْ (b) - consonant only
      `
    },
    {
      title: "Lesson 3: Long Vowels (Madd)",
      content: `
1. ALIF - extends 'a' sound
   آ or اَ = "aaa"

2. WAW - extends 'u' sound
   ـوُ = "uuu"

3. YAA - extends 'i' sound
   ـيِ = "iii"

Duration: Hold long vowels for 2-3 beats
      `
    },
    {
      title: "Lesson 4: Tanwin (Nunation)",
      content: `
Adding 'n' sound to the end:

1. Fathatan (ً) = "an" 
   مُحَمَّدٌ (Muhammadan)

2. Dammatan (ٌ) = "un"
   كِتَابٌ (kitabun)

3. Kasratan (ٍ) = "in"
   جَنَّةٌ (janatin)
      `
    },
    {
      title: "Lesson 5: Shadda (Double Letter)",
      content: `
The Shadda (ّ) means the letter is pronounced twice:

مَرَّ (marra) - "passed" - the 'r' is doubled
سَرَّ (sarra) - "gladdened" - the 'r' is doubled

When a letter has Shadda, hold it for 2 beats.
      `
    },
    {
      title: "Lesson 6: Connecting Letters",
      content: `
28 Arabic letters, 22 connect to the right, 6 do not:

Non-connecting letters:
ا د ذ ر ز و

Connecting letters connect within words to make reading flow.

Example:
علم ('ilm) - knowledge - letters connect smoothly
      `
    },
    {
      title: "Lesson 7: Tajweed Rules - Noon Sakinah Rules",
      content: `
When Noon (ن) has Sukun (no vowel):

1. IZHAR (clear) - before throat letters
   نْ + ح ع ه غ خ = pronounced clearly

2. IDGHAM (merge) - before specific letters
   نْ + ي ن م ل و ر = merged with next letter

3. IQLAB (convert) - before Ba
   نْ + ب = pronounced as "m"

4. IKHFAA (hide) - before other letters
   نْ = hidden soft 'n'
      `
    },
    {
      title: "Lesson 8: Meem Sakinah Rules",
      content: `
When Meem (م) has Sukun (no vowel):

1. IDGHAM - before Meem
   مْ + م = pronounced as one extended meem

2. IKHFAA - before Ba
   مْ + ب = hidden soft 'm' (lips come close but don't seal)

3. IZHAR - before other letters
   مْ + (all other letters) = pronounced clearly
      `
    },
    {
      title: "Lesson 9: Stopping Rules (Waqf)",
      content: `
How to stop at the end of a word:

1. WAQF AAM (full stop) - complete pause
   Used at end of sentence or major pause

2. WAQF ASS - permissible pause
   Can stop but not required

3. WAQF LAZIM - must stop
   Indicated by (ۛ) - must pause here

When stopping on a word with vowel:
Drop the vowel and just say the consonant
Example: محمد (Muhammadu) → stop at (Muhammad)
      `
    }
  ]
};

export default function NooraniBaida() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedLesson, setSelectedLesson] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav title="Noorani Qaida" subtitle="Master Arabic Reading" theme={theme} onThemeToggle={toggleTheme} pageIcon="kids" />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Noorani Qaida - Complete Text Lessons</CardTitle>
            <CardDescription>Learn to read Arabic and Quranic script with proper pronunciation</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          {nooraaniContent.lessons.map((lesson, index) => (
            <Button
              key={index}
              variant={selectedLesson === index ? "default" : "outline"}
              onClick={() => setSelectedLesson(index)}
              className="text-xs sm:text-sm"
              data-testid={`btn-lesson-${index}`}
            >
              Lesson {index + 1}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{nooraaniContent.lessons[selectedLesson].title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-arabic bg-muted/50 p-4 rounded-lg overflow-x-auto">
                {nooraaniContent.lessons[selectedLesson].content}
              </pre>
            </div>
          </CardContent>
        </Card>


        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-900 dark:text-amber-100 mb-3">
            📚 <strong>Study Guide:</strong> Work through each lesson sequentially. Spend time on the Arabic letters first, then progress through vowels, rules, and advanced tajweed.
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            For best results: Read, understand, and practice pronouncing each lesson multiple times before moving to the next.
          </p>
        </div>
      </main>
    </div>
  );
}
