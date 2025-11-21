import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Dua {
  id: string;
  title: string;
  arabicDua: string;
  transliteration: string;
  translation: string;
  reference: string;
  time: string; // When to recite
  benefits: string[];
}

const duas: Dua[] = [
  {
    id: "morning",
    title: "Morning Dua",
    arabicDua: "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ",
    transliteration: "Bismillah ar-Rahman ar-Rahim",
    translation: "In the name of Allah, the Most Gracious, the Most Merciful",
    reference: "Recited at the beginning of all actions",
    time: "Morning",
    benefits: ["Brings blessings to the day", "Protects from harm", "Increases consciousness of Allah"]
  },
  {
    id: "sleep",
    title: "Before Sleep Dua",
    arabicDua: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    translation: "In Your name, O Allah, I die and I live",
    reference: "Surah Al-An'am 6:118",
    time: "Before sleeping",
    benefits: ["Peaceful sleep", "Divine protection at night", "Remembrance of Allah"]
  },
  {
    id: "waking",
    title: "Upon Waking Dua",
    arabicDua: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdulillah alladhi ahyana ba'da ma amatana wa ilayhi an-nushur",
    translation: "Praise be to Allah who gave us life after death and to Him is the return",
    reference: "Surah Al-Baqarah 2:56",
    time: "Upon waking",
    benefits: ["Gratitude for another day", "New beginning", "Remembrance of Allah's power"]
  },
  {
    id: "parents",
    title: "Dua for Parents",
    arabicDua: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَن دَخَلَ بَيْتِيَ مُؤْمِناً",
    transliteration: "Rabbi ighfir li wa li-waliday-ya wa liman dakhala bayti mu'minan",
    translation: "My Lord, forgive me and my parents and whoever enters my house as a believer",
    reference: "Surah Nuh 71:28",
    time: "Regularly",
    benefits: ["Honors parents", "Seeks forgiveness for them", "Brings family together in faith"]
  },
  {
    id: "knowledge",
    title: "Dua for Knowledge",
    arabicDua: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
    transliteration: "Rabbi ishrah li sadri wa yassir li amri",
    translation: "O my Lord, expand my chest and ease my affair",
    reference: "Surah Taha 20:25-26",
    time: "Before studying",
    benefits: ["Clarity of mind", "Ease in learning", "Opens the heart to knowledge"]
  },
  {
    id: "protection",
    title: "Dua for Protection",
    arabicDua: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِن شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bi-kalimati Allahi at-tammati min sharri ma khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He has created",
    reference: "Surah Al-A'raf 7:180",
    time: "Anytime",
    benefits: ["Protection from harm", "Evil eye protection", "Divine shield"]
  }
];

export function DuasSection() {
  const [selectedDua, setSelectedDua] = useState<Dua | null>(duas[0]);

  const playDuaAudio = (arabicText: string) => {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not available');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(arabicText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in speech synthesis:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Learn Duas</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Essential Islamic duas to learn and practice regularly
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Duas List */}
        <div className="space-y-2">
          {duas.map((dua) => (
            <Card
              key={dua.id}
              className={`hover-elevate active-elevate-2 cursor-pointer transition-all p-3 sm:p-4 ${
                selectedDua?.id === dua.id ? 'bg-primary/5 border-primary' : ''
              }`}
              onClick={() => setSelectedDua(dua)}
              data-testid={`dua-card-${dua.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold">{dua.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{dua.time}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Dua Details */}
        {selectedDua && (
          <Card className="hover-elevate">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">{selectedDua.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{selectedDua.reference}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <div>
                <div className="bg-primary/5 p-4 rounded-lg mb-3">
                  <p className="text-lg sm:text-2xl font-arabic text-center leading-loose mb-2" dir="rtl">
                    {selectedDua.arabicDua}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => playDuaAudio(selectedDua.arabicDua)}
                    data-testid={`button-speak-dua-${selectedDua.id}`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Hear Pronunciation
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium mb-1">Transliteration:</p>
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      {selectedDua.transliteration}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium mb-1">Meaning:</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {selectedDua.translation}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium mb-2">Benefits of this Dua:</p>
                    <ul className="space-y-1">
                      {selectedDua.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex gap-2 text-xs sm:text-sm">
                          <span className="text-primary shrink-0">•</span>
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
