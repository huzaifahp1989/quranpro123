import { useState, useEffect } from "react";
import { BookOpen, Moon, Sun, GraduationCap, Book } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Story {
  id: string;
  title: string;
  arabicTitle: string;
  protagonist: string;
  surahReferences: string[];
  summary: string;
  keyLessons: string[];
  verseReference: string;
  narrative: string;
}

const stories: Story[] = [
  {
    id: "yusuf",
    title: "Prophet Yusuf (Joseph)",
    arabicTitle: "سورة يوسف",
    protagonist: "Yusuf (Joseph)",
    surahReferences: ["Surah Yusuf (12)"],
    summary: "The story of Prophet Yusuf, from trials of envy and false accusation to triumph and forgiveness",
    keyLessons: [
      "Patience through hardship brings divine reward",
      "Maintain integrity and moral values in all circumstances",
      "God's plan unfolds with wisdom, even through trials",
      "Forgiveness heals relationships and brings peace",
      "Trust in Allah during times of difficulty"
    ],
    verseReference: "Surah Yusuf 12:4-5",
    narrative: "Yusuf was beloved by his father Ya'qub, which stirred jealousy in his brothers. They cast him into a well, intending to cause harm. He was sold into slavery, falsely accused of wrongdoing, imprisoned unjustly, yet remained patient and faithful. Through divine wisdom, he rose to become the Aziz (minister) of Egypt. When his family came seeking relief during famine, he recognized them and, with humility and forgiveness, reunited with his father."
  },
  {
    id: "musa",
    title: "Prophet Musa (Moses)",
    arabicTitle: "موسى",
    protagonist: "Musa (Moses)",
    surahReferences: ["Surah Musa (7)", "Surah Taha (20)", "Surah Al-Qasas (28)"],
    summary: "The journey of Prophet Musa from fleeing Egypt to leading the Israelites to freedom",
    keyLessons: [
      "Standing up against tyranny with faith",
      "Asking Allah for help and guidance",
      "Miracles affirm the truth of Allah's message",
      "Perseverance against overwhelming odds",
      "Compassion and responsibility toward one's people"
    ],
    verseReference: "Surah Taha 20:9-16",
    narrative: "Musa was born during Pharaoh's tyranny and miraculously saved. Years later, commissioned by Allah, he confronted Pharaoh with signs: his staff becoming a serpent, his hand shining white, plagues upon Egypt. Though Pharaoh's heart hardened with disbelief, Musa led the Israelites to freedom. At the Red Sea, Allah parted the waters, saving the believers while drowning Pharaoh and his army. This was the greatest deliverance in Islamic history."
  },
  {
    id: "ibrahim",
    title: "Prophet Ibrahim (Abraham)",
    arabicTitle: "إبراهيم",
    protagonist: "Ibrahim (Abraham)",
    surahReferences: ["Surah Ibrahim (14)", "Surah Al-Baqarah (2)", "Surah As-Saffat (37)"],
    summary: "The steadfast faith of Prophet Ibrahim and his trials that tested his devotion",
    keyLessons: [
      "Unwavering faith despite pressure from society",
      "Testing of faith comes with great trials",
      "Obedience to Allah supersedes worldly bonds",
      "Building foundations of faith for future generations",
      "Allah rewards the steadfast with honor and remembrance"
    ],
    verseReference: "Surah As-Saffat 37:102-107",
    narrative: "Ibrahim began as a denier of idolatry, preaching monotheism alone against his entire society. Allah tested his faith with trials: leaving his family in a barren valley, preparing to sacrifice his beloved son Ismail. At each trial, Ibrahim showed absolute submission to Allah's will. Due to his constancy, Allah made him an Imam (leader) for all mankind and blessed him with righteous descendants including Prophets Ismail, Ishaq, and Yaqub."
  },
  {
    id: "ayyub",
    title: "Prophet Ayyub (Job)",
    arabicTitle: "أيوب",
    protagonist: "Ayyub (Job)",
    surahReferences: ["Surah Ayyub (21)", "Surah As-Sad (38)"],
    summary: "The remarkable patience of Prophet Ayyub through illness, loss, and suffering",
    keyLessons: [
      "Patience brings the greatest rewards",
      "Wealth and health are temporary blessings",
      "Never lose hope in Allah's mercy",
      "Sincere prayer and remembrance of Allah heal the soul",
      "Tests refine the spirit and increase closeness to Allah"
    ],
    verseReference: "Surah Ayyub 21:83-84",
    narrative: "Ayyub was blessed with immense wealth, family, and health. Satan challenged Allah, claiming Ayyub's faith was only due to blessings. Allah permitted a trial: Ayyub lost his wealth, his children died, and he was afflicted with a severe disease for years. Yet, he never despaired or complained. He only said, 'Indeed, adversity has touched me, and you are the Most Merciful of the merciful.' Allah, pleased with his patience, restored everything and more, making him an eternal example of steadfastness."
  },
  {
    id: "nuh",
    title: "Prophet Nuh (Noah)",
    arabicTitle: "نوح",
    protagonist: "Nuh (Noah)",
    surahReferences: ["Surah Nuh (71)"],
    summary: "Prophet Nuh's mission to guide his people for 950 years, calling them to monotheism",
    keyLessons: [
      "Perseverance in delivering truth despite rejection",
      "Compassion and mercy for those who oppose",
      "Allah rewards those who remain faithful",
      "The consequences of rejecting divine guidance",
      "One righteous soul is better than a thousand hypocrites"
    ],
    verseReference: "Surah Nuh 71:5-10",
    narrative: "Nuh was sent to his people for 950 years, calling them to worship Allah alone and abandon idolatry. He preached with gentleness and wisdom, yet only a few believed. His own son refused to enter the Ark when the Great Flood came. Despite the rejection and ridicule, Nuh never lost hope in Allah's wisdom. Those who believed with him were saved, while those who mocked perished. Nuh's dedication established the foundation for all future prophets."
  },
  {
    id: "isa",
    title: "Prophet Isa (Jesus)",
    arabicTitle: "عيسى",
    protagonist: "Isa (Jesus)",
    surahReferences: ["Surah Maryam (19)", "Surah Al-Imran (3)", "Surah An-Nisa (4)"],
    summary: "Prophet Isa's miraculous birth, ministry of healing, and message of monotheism",
    keyLessons: [
      "Allah's power transcends natural laws",
      "Miracles affirm prophetic truth",
      "Compassion and healing are acts of faith",
      "Staying true to monotheism despite opposition",
      "Sincere believers follow the straight path"
    ],
    verseReference: "Surah Maryam 19:33-34",
    narrative: "Isa was born to Maryam (Mary), a virgin, through divine will, without a father. He spoke from the cradle, proclaiming his message. Allah granted him miracles: healing the blind and lepers by permission, reviving the dead, and creating a bird from clay. He called people to worship Allah alone, rejecting the false notion of trinity. He taught with mercy and compassion, yet faced fierce opposition. Allah protected him from those who sought to harm him, and he remains a sign of Allah's power and mercy."
  }
];

export default function QuranicStories() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold truncate">Quranic Stories</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Tales of Prophets and Divine Wisdom</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link href="/kids">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-nav-kids"
                  className="gap-1 sm:gap-2 h-8 sm:h-9"
                >
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Kids Learning</span>
                  <span className="md:hidden text-xs">Kids</span>
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-nav-quran"
                  className="gap-1 sm:gap-2 h-8 sm:h-9"
                >
                  <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Read Quran</span>
                  <span className="md:hidden text-xs">Quran</span>
                </Button>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                aria-label="Toggle theme"
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Stories of the Prophets</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Learn from the lives and trials of Allah's chosen messengers</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
              data-testid={`story-card-${story.id}`}
            >
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg mb-1">{story.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{story.surahReferences.join(", ")}</CardDescription>
                  </div>
                  <span className="font-arabic text-lg sm:text-xl shrink-0">{story.arabicTitle}</span>
                </div>
              </CardHeader>

              {expandedStory === story.id && (
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 border-t pt-4 sm:pt-6">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-2">Summary</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{story.summary}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-2">The Narrative</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{story.narrative}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-2">Key Lessons</h3>
                    <ul className="space-y-2">
                      {story.keyLessons.map((lesson, idx) => (
                        <li key={idx} className="flex gap-2 text-xs sm:text-sm">
                          <span className="text-primary shrink-0 mt-1">•</span>
                          <span className="text-muted-foreground">{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium mb-1">Quranic Reference:</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{story.verseReference}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
