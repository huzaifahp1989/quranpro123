import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuranicStory {
  id: string;
  title: string;
  arabicTitle: string;
  protagonist: string;
  surahReferences: { surah: string; number: number; para: string; ayat: string }[];
  summary: string;
  keyLessons: string[];
  narrative: string;
}

interface AsbaabNuzool {
  id: string;
  surah: string;
  surahNumber: number;
  ayat: string;
  para: string;
  reason: string;
  historicalContext: string;
}

const stories: QuranicStory[] = [
  {
    id: "yusuf",
    title: "Prophet Yusuf (Joseph) - The Best of Stories",
    arabicTitle: "سورة يوسف",
    protagonist: "Yusuf (Joseph)",
    surahReferences: [
      { surah: "Yusuf", number: 12, para: "Para 12-13", ayat: "12:4-5, 12:15-22, 12:24-35, 12:50-93" }
    ],
    summary: "The comprehensive story of Prophet Yusuf, from jealousy and trials to triumph and mercy",
    keyLessons: [
      "Allah's protection of the righteous even in darkness",
      "Patience (Sabr) leads to divine victory",
      "Maintaining chastity and purity despite temptation",
      "Interpretation of dreams through Allah's wisdom",
      "Forgiveness is greater than revenge",
      "Allah elevates the humble to positions of honor",
      "Testing faith refines character",
      "Trust in Allah's plan despite seemingly impossible situations"
    ],
    narrative: "Yusuf, the beloved son of Ya'qub, was thrown into a well by jealous brothers and sold into slavery in Egypt. Potiphar's wife falsely accused him; he was imprisoned unjustly. Yet he remained patient, truthful, and relied on Allah. His interpretation of prisoners' dreams eventually reached Pharaoh, who freed him and made him treasurer of Egypt. Years later, his starving family came to Egypt for grain. Yusuf recognized them but initially tested them, ultimately revealing his identity with profound forgiveness and mercy. The entire family migrated to Egypt, and Yusuf's father's eyes were restored to sight."
  },
  {
    id: "musa",
    title: "Prophet Musa (Moses) - The One Spoke To",
    arabicTitle: "موسى",
    protagonist: "Musa (Moses)",
    surahReferences: [
      { surah: "Al-Qasas (The Stories)", number: 28, para: "Para 20-21", ayat: "28:3-28, 28:36-46" },
      { surah: "Taha", number: 20, para: "Para 16", ayat: "20:9-127" },
      { surah: "Al-A'raf", number: 7, para: "Para 8-9", ayat: "7:103-162" }
    ],
    summary: "The journey of Musa from abandonment to receiving the Quran at Sinai to leading his people to freedom",
    keyLessons: [
      "Allah protects His messengers from harm",
      "Courage to stand against tyranny with faith",
      "Seeking help from Allah is the greatest strategy",
      "Signs and miracles are for those who believe",
      "Leadership requires patience with people",
      "The Law (Torah) guides both faith and practice",
      "Even after miracles, hearts can harden",
      "Perseverance despite rejection and difficulty"
    ],
    narrative: "Musa's mother placed him in a basket on the Nile to escape Pharaoh's infanticide. Pharaoh's wife adopted him, unknowingly raising Allah's future prophet. At maturity, Musa witnessed injustice, killed an Egyptian in defense, and fled to Madyan. There, he married and tended sheep for his father-in-law. At Mount Tur, Allah called him to prophethood. Commissioned to confront Pharaoh, Musa performed miracles: his staff became a serpent, his hand shone white. Despite nine plagues, Pharaoh's heart hardened. Finally, Allah commanded the Israelites to leave. At the Red Sea, Allah parted the waters for them and drowned Pharaoh. On Sinai, Allah gave Musa the Tablets of the Law. Yet, in his absence, the people worshipped the golden calf. Musa's leadership involved constant patience with their rebellion, culminating in forty years of wilderness wandering as punishment."
  },
  {
    id: "ibrahim",
    title: "Prophet Ibrahim (Abraham) - The Friend of Allah",
    arabicTitle: "إبراهيم",
    protagonist: "Ibrahim (Abraham)",
    surahReferences: [
      { surah: "As-Saffat (The Ranks)", number: 37, para: "Para 23", ayat: "37:83-113" },
      { surah: "An-Nahl (The Bee)", number: 16, para: "Para 14", ayat: "16:120-123" },
      { surah: "Al-Baqarah", number: 2, para: "Para 3", ayat: "2:124-141" }
    ],
    summary: "Ibrahim's unwavering monotheism, his trials, and his foundation of faith for all humanity",
    keyLessons: [
      "Reject idolatry and establish pure monotheism",
      "Wisdom in delivering the message of Allah",
      "Absolute obedience transcends emotional bonds",
      "Trust in Allah's plan in all circumstances",
      "Prayer and dua are weapons of the believer",
      "Building spiritual foundations for future generations",
      "The Ka'bah - the House of Allah - is a beacon",
      "Abraham is the father of believers and friend of Allah"
    ],
    narrative: "Ibrahim was born into a society of idolators. Through intellectual reasoning, he rejected their gods, famously destroying their idols to demonstrate their powerlessness. His family rejected him; he was cast into fire by King Nimrod, but Allah made the fire cool and safe. Commanded to leave his family in the barren valley of Makkah, Ibrahim obeyed, praying for its population. Tested to sacrifice his son Ismail, he proceeded in obedience—yet Allah substituted a ram. He built the Ka'bah with his son, establishing it as a sanctuary. After his trials, Allah declared him Khalil (Friend), elevated him as an Imam, and promised him righteous descendants. His legacy - monotheism - became the foundation of Judaism, Christianity, and Islam."
  },
  {
    id: "ayyub",
    title: "Prophet Ayyub (Job) - The Patient One",
    arabicTitle: "أيوب",
    protagonist: "Ayyub (Job)",
    surahReferences: [
      { surah: "Al-Anbiya (The Prophets)", number: 21, para: "Para 17", ayat: "21:83-84" },
      { surah: "As-Sad (The Letter Sad)", number: 38, para: "Para 23", ayat: "38:41-44" }
    ],
    summary: "Ayyub's severe trials and miraculous recovery through patience and reliance on Allah",
    keyLessons: [
      "Patience (Sabr) is a virtue of the noble",
      "Trials refine the soul and test sincerity",
      "Wealth and health are temporary divine blessings",
      "Call upon Allah directly in times of hardship",
      "Despair is disbelief; hope is in Allah's mercy",
      "The righteous are tested most severely",
      "Prayer and dua during difficulty are powerful",
      "Allah's mercy is always near for the sincere"
    ],
    narrative: "Ayyub was blessed abundantly - wealth, children, health, and faith. Satan challenged Allah, claiming Ayyub's devotion depended on prosperity. Allah permitted trials: the Devil took his wealth, his children died, and his body was afflicted with severe illness for years. His flesh decayed, his wealth vanished, his family abandoned him. Yet, he never despaired. His sole prayer: 'Truly, adversity has touched me, and You are the Most Merciful of the merciful.' Allah was pleased with his patience and sincerity. He restored his health, returned his wealth doubled, gave him new children, and the memory of Ayyub became eternal—a symbol of steadfast patience in Islamic tradition."
  },
  {
    id: "nuh",
    title: "Prophet Nuh (Noah) - The Preacher of Faith",
    arabicTitle: "نوح",
    protagonist: "Nuh (Noah)",
    surahReferences: [
      { surah: "Nuh (Noah)", number: 71, para: "Para 29", ayat: "71:1-28" },
      { surah: "Al-A'raf", number: 7, para: "Para 8", ayat: "7:59-64" },
      { surah: "Hud", number: 11, para: "Para 12", ayat: "11:25-49" }
    ],
    summary: "Nuh's 950-year mission to guide his people to monotheism despite universal rejection",
    keyLessons: [
      "Perseverance in calling to truth despite rejection",
      "Patience with stubborn hearts is virtuous",
      "Few believe when most reject the message",
      "Gentleness and wisdom in preaching",
      "Allah's punishment comes to those who reject",
      "The Flood - a merciful cleansing for the believers",
      "One righteous soul is worth more than thousands",
      "The mission of prophets spans generations"
    ],
    narrative: "Nuh preached monotheism to his people for 950 years. He called them day and night, openly and privately, with gentleness and wisdom. Yet, only a few—his family and believers—heeded his message. The elite mocked him, saying, 'You are just a human like us, seeking honor.' Despite his compassion, the people mocked, ridiculed, and rejected him. None accepted except those who believed. His own son refused to board the Ark. When the appointed time arrived, Allah commanded Nuh: 'Build the Ark under Our eyes.' The flood came, destroying all who rejected, while the believers entered the Ark. Nuh's mission ended in the salvation of the few and the destruction of the disbelievers—a mercy for believers and a punishment for rejectors."
  },
  {
    id: "isa",
    title: "Prophet Isa (Jesus) - The Messenger Miracles",
    arabicTitle: "عيسى",
    protagonist: "Isa (Jesus)",
    surahReferences: [
      { surah: "Maryam (Mary)", number: 19, para: "Para 16", ayat: "19:16-35, 19:88-98" },
      { surah: "Al-Imran (The Family of Imran)", number: 3, para: "Para 3-4", ayat: "3:45-58" },
      { surah: "An-Nisa (The Women)", number: 4, para: "Para 5", ayat: "4:157-159" }
    ],
    summary: "Isa's miraculous birth, divine signs, message of monotheism, and protection from enemies",
    keyLessons: [
      "Allah's power transcends natural laws and biology",
      "Miracles affirm the truth of messengers",
      "Compassion and healing are acts of faith",
      "Calling people to worship Allah alone",
      "The pure will face opposition from the corrupt",
      "Allah protects His truthful messengers",
      "Humility in the face of miracles",
      "The message is preserved despite misrepresentation"
    ],
    narrative: "Isa was born to Maryam (Mary), a virgin, through a special creation by Allah's will, without a father. When the people doubted, he spoke from the cradle, declaring his prophethood. Allah granted him miracles: healing the blind and lepers, reviving the dead—all by Allah's permission. He created a bird from clay and breathed life into it. His message was clear: 'Worship Allah, my Lord and your Lord.' Yet, the priests and leaders felt threatened. They plotted against him. Allah ascended him to the heavens, and his followers preserved his teachings. He will return before the Day of Judgment to establish justice and true monotheism. His legacy remains as a sign of Allah's mercy and power."
  },
  {
    id: "luqman",
    title: "Luqman the Wise - The Moral Teacher",
    arabicTitle: "لقمان",
    protagonist: "Luqman (Wise Man)",
    surahReferences: [
      { surah: "Luqman", number: 31, para: "Para 21", ayat: "31:12-19" }
    ],
    summary: "Luqman's moral and spiritual advice to his son and humanity",
    keyLessons: [
      "Wisdom comes from fearing Allah and gratitude",
      "Parents must teach children monotheism",
      "Respect and honor toward parents is obligatory",
      "Good character is manifested in all actions",
      "Modesty and humility in speech and gait",
      "The consequences of pride and arrogance",
      "Justice and truth are foundations of society",
      "Teaching children moral values is sacred trust"
    ],
    narrative: "While Luqman is not explicitly identified as a prophet, his wisdom in Surah Luqman is revered. He taught his son profound lessons: 'Do not associate partners with Allah - this is a great injustice,' 'Be good to your parents,' 'Establish prayer and command good,' 'Be patient over what befalls you,' 'Do not avert your face in contempt,' 'Speak in a moderate tone.' His advice addressed every aspect of life—faith, family, society, and morality. His words remain timeless guidance for parents and children, representing the transmission of wisdom and moral values through generations. His teachings are among the most cherished ethical instructions in Islamic literature."
  },
  {
    id: "ashaab-alkahf",
    title: "The Companions of the Cave - Faith in Isolation",
    arabicTitle: "أصحاب الكهف",
    protagonist: "Young Believers",
    surahReferences: [
      { surah: "Al-Kahf (The Cave)", number: 18, para: "Para 15-16", ayat: "18:9-26" }
    ],
    summary: "Youths who fled persecution and received divine protection in a cave",
    keyLessons: [
      "Courage to abandon comfort for faith",
      "Seeking refuge in Allah is ultimate protection",
      "Community of believers strengthens resolve",
      "Allah's miracles preserve the faithful",
      "Time is in Allah's hands alone",
      "Resurrection and accountability are certain",
      "The importance of spiritual counsel and support",
      "Faith triumphs over material concerns"
    ],
    narrative: "These young believers lived during a time of religious persecution. Unwilling to worship idols, they fled to a cave, seeking only Allah's protection and mercy. They prayed, 'Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.' Allah caused them to sleep for 309 years. When they awoke, they thought only a day had passed. They ventured to the city to buy food, unaware of the centuries that had elapsed. The people recognized them as signs of the resurrection. Their story exemplifies faith, courage, and divine protection. The cave became a place of pilgrimage, and their tomb a source of blessing—a timeless reminder that Allah protects those who trust Him."
  },
  {
    id: "dhulqarnain",
    title: "Dhul-Qarnayn - The Builder Against Gog and Magog",
    arabicTitle: "ذو القرنين",
    protagonist: "Dhul-Qarnayn",
    surahReferences: [
      { surah: "Al-Kahf (The Cave)", number: 18, para: "Para 15-16", ayat: "18:83-98" }
    ],
    summary: "A just ruler who built a wall against Gog and Magog with faith and wisdom",
    keyLessons: [
      "Justice is the foundation of righteous leadership",
      "Wisdom in governance includes consultation",
      "Combining material means with trust in Allah",
      "Preparedness against future threats",
      "Humility despite power and authority",
      "Protecting the vulnerable is a divine trust",
      "The balance between action and reliance on Allah",
      "Gratitude for divine blessings"
    ],
    narrative: "Dhul-Qarnayn traveled the lands, establishing justice and preaching monotheism. People sought his help against Gog and Magog—destructive tribes who raided their settlements. Rather than accepting payment, he requested they work with him to build a wall of iron and copper. With divine assistance, they constructed a massive barrier. When Gog and Magog try to scale it on the Day of Judgment, they will break through. His story illustrates that true strength lies not in military might but in justice, consultation, and reliance on Allah. The wall remains a symbol of preparation and wisdom."
  },
  {
    id: "sulayman",
    title: "Prophet Sulayman (Solomon) - Master of Knowledge",
    arabicTitle: "سليمان",
    protagonist: "Sulayman (Solomon)",
    surahReferences: [
      { surah: "An-Naml (The Ant)", number: 27, para: "Para 19-20", ayat: "27:15-44" },
      { surah: "Saba (Sheba)", number: 34, para: "Para 22", ayat: "34:12-13" },
      { surah: "As-Sad (The Letter Sad)", number: 38, para: "Para 23", ayat: "38:30-40" }
    ],
    summary: "Sulayman's unique knowledge, authority over creation, and just rulership",
    keyLessons: [
      "Gratitude opens doors to greater blessings",
      "Authority should be used justly and mercifully",
      "Understanding creation reveals divine wisdom",
      "Consultation and gentleness in leadership",
      "Miracles demonstrate divine power and favor",
      "Humility despite power and authority",
      "Knowledge of the unseen is Allah's alone",
      "Mercy toward all creation is virtue"
    ],
    narrative: "Sulayman, son of Dawud, inherited knowledge and authority. He prayed, 'My Lord, forgive me and grant me a kingdom such as none deserves after me.' Allah granted him unique powers: the wind obeyed his command, the brass flowed by his permission, the jinn worked under his supervision. He understood the speech of birds. When reviewing an army of jinn, humans, and birds, he noted the absence of a hoopoe and threatened punishment. The hoopoe returned with news of Sheba's queen and her people worshipping the sun. He requested the throne before they arrived. A demon brought it instantly. Upon its arrival, he thanked Allah. The queen and her people accepted Islam. His wisdom, mercy, and justice became legendary—a model of righteous governance."
  },
  {
    id: "ashaab-alkhayal",
    title: "The Owners of the Garden - Greed's Consequences",
    arabicTitle: "أصحاب الجنة",
    protagonist: "The Rich Brothers",
    surahReferences: [
      { surah: "Al-Qalam (The Pen)", number: 68, para: "Para 29", ayat: "68:17-33" }
    ],
    summary: "Two brothers and their garden - a lesson on greed, ingratitude, and divine warning",
    keyLessons: [
      "Ingratitude turns blessings into punishment",
      "Greed blinds the heart to truth",
      "Boasting about possessions invites divine wrath",
      "Mutual respect and consultation preserve wealth",
      "Charity and gratitude protect blessings",
      "Arrogance leads to destruction",
      "Wealth is a test from Allah",
      "The poor and needy deserve consideration"
    ],
    narrative: "Two brothers received a beautiful garden from their father, blessed with dates, vines, and springs. One brother, arrogant and ungrateful, said to his believing brother, 'I am greater than you in wealth and mightier in men.' His brother, faithful, replied, 'Perhaps Allah will grant me something better. Do not associate partners with Allah.' One night, Allah sent a calamity that destroyed the entire garden, leaving it blackened and barren. The arrogant brother stood in regret, wishing he had never associated partners with Allah. His wealth could not protect him, nor his people. The story warns against ingratitude, arrogance, and the temporary nature of worldly possessions—a Divine reminder that true wealth is piety and gratitude."
  }
];

const asbaabNuzool: AsbaabNuzool[] = [
  {
    id: "ayat-al-kursee",
    surah: "Al-Baqarah",
    surahNumber: 2,
    ayat: "2:255",
    para: "Para 3",
    reason: "Revealed regarding Allah's comprehensive knowledge and protection",
    historicalContext: "This verse was revealed as a reminder of Allah's might and omniscience. It serves as protection and reassurance for believers."
  },
  {
    id: "hijab-ayat",
    surah: "Al-Ahzab",
    surahNumber: 33,
    ayat: "33:53",
    para: "Para 22",
    reason: "Revealed after an incident regarding the modesty of the Prophet's wives during a meal",
    historicalContext: "When the Prophet's wives were served at a gathering, guests lingered. Allah revealed the hijab injunction to establish boundaries and protect the Prophet's family."
  },
  {
    id: "surah-tauba",
    surah: "At-Taubah",
    surahNumber: 9,
    ayat: "9:1-10",
    para: "Para 10-11",
    reason: "Revealed to announce the breaking of treaties with polytheists",
    historicalContext: "Concerning the declaration of war against those who repeatedly violated treaties with the Muslims."
  },
  {
    id: "surah-nur",
    surah: "An-Nur",
    surahNumber: 24,
    ayat: "24:2-10",
    para: "Para 18",
    reason: "Revealed regarding an accusation against Aisha in the Ifk incident",
    historicalContext: "When hypocrites spread false rumors about the Prophet's wife, Allah revealed verses defending her honor and establishing legal principles for accusations."
  },
  {
    id: "khamr-ayat",
    surah: "Al-Baqarah",
    surahNumber: 2,
    ayat: "2:219",
    para: "Para 2",
    reason: "Revealed addressing questions about intoxicants and gambling",
    historicalContext: "Companions asked about wine and gambling. This verse was revealed explaining their harmful effects and restrictions."
  },
  {
    id: "riba-ayat",
    surah: "Al-Baqarah",
    surahNumber: 2,
    ayat: "2:275-280",
    para: "Para 3",
    reason: "Revealed concerning the prohibition of interest (Riba) in transactions",
    historicalContext: "Allah clearly prohibited usury and established fair economic principles for believers."
  },
  {
    id: "hijra-ayat",
    surah: "An-Nahl",
    surahNumber: 16,
    ayat: "16:41-42",
    para: "Para 14",
    reason: "Regarding the migration of believers from Makkah to Madinah",
    historicalContext: "These verses were revealed encouraging believers to emigrate from persecution to safety."
  },
  {
    id: "zakat-ayat",
    surah: "At-Taubah",
    surahNumber: 9,
    ayat: "9:60",
    para: "Para 10",
    reason: "Revealed specifying the recipients and categories of Zakat (charity)",
    historicalContext: "Allah clarified who deserves Zakat and the principles of charitable distribution."
  },
  {
    id: "hajj-ayat",
    surah: "Al-Hajj",
    surahNumber: 22,
    ayat: "22:27-28",
    para: "Para 17",
    reason: "Revealed regarding the rituals and spirituality of Hajj pilgrimage",
    historicalContext: "Allah described the sacred rituals and spiritual significance of the Hajj for believers."
  },
  {
    id: "wudu-ayat",
    surah: "Al-Maidah",
    surahNumber: 5,
    ayat: "5:6",
    para: "Para 6",
    reason: "Revealed concerning the ritual purification before prayer",
    historicalContext: "Allah established the method and importance of ritual purification (Wudu) before prayer."
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
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Tales with Ayaat & Lessons</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link href="/kids">
                <Button
                  variant="outline"
                  size="icon"
                  data-testid="button-nav-kids"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  title="Kids"
                >
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  size="icon"
                  data-testid="button-nav-quran"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  title="Quran"
                >
                  <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="stories" data-testid="tab-stories" className="text-xs sm:text-sm">
              Stories
            </TabsTrigger>
            <TabsTrigger value="asbab" data-testid="tab-asbab" className="text-xs sm:text-sm">
              Asbab Al-Nuzool
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories" className="space-y-4">
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Stories from the Quran</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Complete narratives with Ayaat references, Para numbers, and spiritual lessons</p>
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg mb-1">{story.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {story.surahReferences.map((ref, idx) => (
                            <span key={idx}>
                              {ref.surah} {ref.number} • Para {ref.para.split("-")[0].trim()} • Ayaat: {ref.ayat}
                              {idx < story.surahReferences.length - 1 && " | "}
                            </span>
                          ))}
                        </CardDescription>
                      </div>
                      <span className="font-arabic text-lg sm:text-xl shrink-0">{story.arabicTitle}</span>
                      <ChevronDown
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform shrink-0 ${
                          expandedStory === story.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>

                  {expandedStory === story.id && (
                    <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 border-t pt-4 sm:pt-6">
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base mb-2">The Narrative</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{story.narrative}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Key Lessons</h3>
                        <ul className="space-y-1">
                          {story.keyLessons.map((lesson, idx) => (
                            <li key={idx} className="flex gap-2 text-xs sm:text-sm">
                              <span className="text-primary shrink-0">•</span>
                              <span className="text-muted-foreground">{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-primary/5 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium mb-1">Quranic References:</p>
                        {story.surahReferences.map((ref, idx) => (
                          <p key={idx} className="text-xs sm:text-sm text-muted-foreground">
                            {ref.surah} (Surah {ref.number}) • Para {ref.para} • Verses: {ref.ayat}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="asbab" className="space-y-4">
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Asbab Al-Nuzool</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Reasons and historical context for the revelation of Quranic verses</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {asbaabNuzool.map((nuzool) => (
                <Card key={nuzool.id} className="hover-elevate p-4 sm:p-6">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">
                        {nuzool.surah} {nuzool.surahNumber}:{nuzool.ayat.split(":")[1]}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Para {nuzool.para}</p>
                    </div>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">Verse {nuzool.ayat}</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium mb-1">Reason for Revelation:</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{nuzool.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">Historical Context:</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{nuzool.historicalContext}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
