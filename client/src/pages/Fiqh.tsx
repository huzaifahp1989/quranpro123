import { useState, useEffect } from "react";
import { ChevronDown, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FiqhTopic {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  rules: FiqhRule[];
}

interface FiqhRule {
  title: string;
  description: string;
  details?: string[];
  conditions?: string[];
}

const fiqhTopics: FiqhTopic[] = [
  {
    id: "wudhu",
    title: "Wudhu (Ablution)",
    arabicTitle: "الوضوء",
    description: "Ritual purification before prayer and Quran recitation",
    rules: [
      {
        title: "Pillars (Fard) of Wudhu",
        description: "Essential actions that must be performed",
        details: [
          "Intention (Niyyah) - Make intention in the heart to purify for prayer",
          "Washing the face - From hairline to chin, including mouth and nose",
          "Washing the arms - From elbows to fingertips (right arm first)",
          "Wiping the head - At least a quarter of the head",
          "Washing the feet - Including between toes up to ankles (right foot first)"
        ]
      },
      {
        title: "Procedure (Sunnah) of Wudhu",
        description: "The recommended way to perform Wudhu",
        details: [
          "Begin with 'Bismillah' (In the name of Allah)",
          "Wash hands three times up to wrists",
          "Rinse mouth three times",
          "Sniff water into nostrils three times",
          "Wash face three times with both hands",
          "Wash right arm three times from fingertips to above elbow",
          "Wash left arm three times from fingertips to above elbow",
          "Wipe entire head once, including ears",
          "Wash right foot three times up to ankle",
          "Wash left foot three times up to ankle"
        ]
      },
      {
        title: "Things that Break Wudhu",
        description: "Actions that invalidate ablution",
        details: [
          "Any emission from the front or back passage (urine, stool, gas)",
          "Deep sleep",
          "Loss of consciousness",
          "Bleeding from wounds that flow beyond the wound",
          "Vomiting"
        ]
      },
      {
        title: "Conditions of Valid Wudhu",
        description: "Prerequisites for acceptance",
        conditions: [
          "Use of pure water (not contaminated)",
          "Water should not be excessive or deficient",
          "Proper intention must be made",
          "Following the correct sequence",
          "Rubbing all parts while washing",
          "Continuity (completing all parts without long interruption)"
        ]
      }
    ]
  },
  {
    id: "ghusal",
    title: "Ghusal (Full Body Ablation)",
    arabicTitle: "الغسل",
    description: "Complete ritual bath required after major impurity",
    rules: [
      {
        title: "When Ghusal is Obligatory (Wajib)",
        description: "Situations requiring full body ablation",
        details: [
          "After sexual intercourse",
          "After emission of semen",
          "After menstruation (for women)",
          "After postpartum bleeding (for women)",
          "Preparing a deceased person for burial",
          "For a convert to Islam"
        ]
      },
      {
        title: "Procedure (Sunnah) of Ghusal",
        description: "The recommended way to perform Ghusal",
        details: [
          "Make intention (Niyyah) in the heart",
          "Begin with 'Bismillah'",
          "Wash hands thoroughly three times",
          "Clean private parts with left hand",
          "Perform wudhu (except feet, which will be washed later)",
          "Pour water over the entire body three times, starting from head",
          "Rub the body thoroughly while water flows",
          "Pour water over the feet",
          "Ensure water reaches all parts of the body including hair roots"
        ]
      },
      {
        title: "Conditions of Valid Ghusal",
        description: "Requirements for acceptance",
        details: [
          "Pure water must be used",
          "All parts of the body must be washed",
          "No impurity should remain on the body",
          "Must be performed with intention",
          "Water should reach the skin under hair",
          "Cannot be performed while in a state of major impurity remains"
        ]
      },
      {
        title: "Things that Require Ghusal",
        description: "Additional situations",
        details: [
          "Waking up from sleep after experiencing nocturnal emission",
          "Any sexual activity between spouses",
          "Death - the deceased person must be given Ghusal (Ghusl-al-Mayyit)"
        ]
      }
    ]
  },
  {
    id: "salah",
    title: "Salah (Prayer)",
    arabicTitle: "الصلاة",
    description: "The five daily prayers - pillars of Islam",
    rules: [
      {
        title: "The Five Daily Prayers",
        description: "Times and names of obligatory prayers",
        details: [
          "Fajr - Before sunrise (2 Rak'ahs)",
          "Dhuhr - When sun passes zenith (4 Rak'ahs)",
          "Asr - Late afternoon (4 Rak'ahs)",
          "Maghrib - Just after sunset (3 Rak'ahs)",
          "Isha - After dark (4 Rak'ahs)"
        ]
      },
      {
        title: "Pillars (Fard) of Salah",
        description: "Essential components of prayer",
        details: [
          "Intention (Niyyah) - Determine which prayer you are praying",
          "Standing (for those able) - Facing Qibla (direction of Ka'bah)",
          "Takbir (Allahu Akbar) - Begin prayer with 'Allahu Akbar'",
          "Recitation of Surah Al-Fatihah - In every Rak'ah",
          "Ruku (Bowing) - Bow with hands on knees",
          "Sujud (Prostration) - Twice in each Rak'ah",
          "Sitting between prostrations (Jalsah) - Sit up briefly",
          "Tashahhud - Recite the testimony sitting at the end",
          "Taslim (Salam) - Conclude prayer with 'Assalamu Alaikum'"
        ]
      },
      {
        title: "Conditions for Valid Prayer",
        description: "Prerequisites that must be met",
        conditions: [
          "Wudhu (ablution) or Ghusal must be performed",
          "Body and clothes must be clean",
          "Prayer place must be clean",
          "Awrah (private parts) must be covered - chest and thighs for men; entire body except face, hands, feet for women",
          "Facing Qibla (Mecca) is required",
          "Time of prayer must have entered",
          "Intention must be made",
          "Attention and focus (Khushu) in heart"
        ]
      },
      {
        title: "Things that Break Prayer",
        description: "Actions that invalidate prayer",
        details: [
          "Speaking or unnecessary sounds",
          "Eating or drinking",
          "Passing wind or any major impurity",
          "Excessive movement not required by prayer",
          "Turning away from Qibla without valid reason",
          "Uncovering of awrah",
          "Laughing loudly",
          "Leaving a pillar intentionally"
        ]
      },
      {
        title: "Encouraged Acts (Sunnah)",
        description: "Recommended practices to enhance prayer",
        details: [
          "Early takbir - Start with first congregational takbir",
          "Prolonged recitation - Extend Quran recitation",
          "Lengthy bowing and prostration - Increase time in Ruku and Sujud",
          "Quiet breathing (khushu) - Focus with full attention",
          "Sending blessings upon Prophet Muhammad (صلى الله عليه وسلم)",
          "Making Dua after prayers"
        ]
      }
    ]
  },
  {
    id: "fasting",
    title: "Fasting (Sawm)",
    arabicTitle: "الصيام",
    description: "Abstaining from food and drink during Ramadan",
    rules: [
      {
        title: "Intention (Niyyah) for Fasting",
        description: "Essential requirement for valid fast",
        details: [
          "Intention must be made before Fajr (dawn) time",
          "For obligatory (Fard) fasting, intention can be made anytime before Fajr",
          "For voluntary fasting, intention must be made before noon if starting same day",
          "Intention should be from the heart",
          "Can be made silently - no verbal declaration needed"
        ]
      },
      {
        title: "Pillars (Fard) of Fasting",
        description: "Essential actions of a valid fast",
        details: [
          "Intention (Niyyah) - To fast for Allah's sake",
          "Abstaining from food - From Fajr until Maghrib",
          "Abstaining from drink - From Fajr until Maghrib",
          "Abstaining from sexual intercourse - During fasting hours",
          "Guarding the tongue and private parts - From sins and disobedience"
        ]
      },
      {
        title: "Things that Break the Fast",
        description: "Actions that invalidate fasting",
        details: [
          "Eating intentionally during fasting hours",
          "Drinking intentionally during fasting hours",
          "Sexual intercourse during fasting hours",
          "Deliberate vomiting",
          "Emission from private parts due to lustful thoughts",
          "Menstruation (for women)",
          "Postpartum bleeding (for women)",
          "Apostasy or rejecting faith"
        ]
      },
      {
        title: "Who is Excused from Fasting",
        description: "Valid reasons for postponement",
        details: [
          "Children before puberty (not obligatory)",
          "Elderly who cannot fast (can feed poor instead)",
          "Chronically ill persons (can feed poor)",
          "Traveler on journey (can make up later)",
          "Menstruating women (make up days later)",
          "Pregnant women if fasting harms them (make up later)",
          "Breastfeeding women if fasting harms baby (make up later or feed poor)",
          "Anyone with medical emergency requiring nutrition"
        ]
      },
      {
        title: "Encouraged Practices (Sunnah)",
        description: "Recommended acts during fasting",
        details: [
          "Suhur (pre-dawn meal) - Eat light meal before Fajr",
          "Iftar (breaking fast) - Break fast with dates and water at Maghrib",
          "Reciting Quran extensively during Ramadan",
          "Performing Taraweeh prayers in congregation",
          "Increased charity and generosity",
          "Avoiding idle talk and disputes",
          "Sleeping and resting appropriately",
          "Making sincere Dua (supplication)"
        ]
      }
    ]
  },
  {
    id: "zakat",
    title: "Zakat (Obligatory Charity)",
    arabicTitle: "الزكاة",
    description: "Annual purification of wealth by giving to the poor",
    rules: [
      {
        title: "Conditions for Zakat Obligation",
        description: "When Zakat becomes mandatory",
        details: [
          "Must be Muslim - Non-Muslims do not pay Zakat",
          "Must possess minimum wealth (Nisab) - Equivalent to 87.48 grams of gold or 612.36 grams of silver",
          "Must have owned wealth for one lunar year (Hawl) - Full Islamic year of possession",
          "Wealth must be surplus to basic needs - After meeting living expenses",
          "Must be of zakatable property - Gold, silver, cash, merchandise, livestock, crops",
          "Must reach maturity and have sound mind"
        ]
      },
      {
        title: "Percentage (Rate) of Zakat",
        description: "Amount of Zakat due on different types of wealth",
        details: [
          "Gold and Silver: 2.5% (1/40) of total amount",
          "Cash and Savings: 2.5% (1/40) of total amount",
          "Livestock - Sheep/Goats: 1 sheep/goat per 40 animals",
          "Livestock - Cattle/Buffalo: 1 animal per 30 animals",
          "Livestock - Camels: 1 camel per 5 camels",
          "Agricultural Produce: 5-10% depending on irrigation method",
          "Merchandise (Business Stock): 2.5% of total value"
        ]
      },
      {
        title: "Deserving Recipients of Zakat",
        description: "Eight categories who can receive Zakat",
        details: [
          "Al-Fuqara (The Poor) - Those with no means of sustenance",
          "Al-Masakin (The Needy) - Those with insufficient means",
          "Al-Amilin (Workers) - Those collecting and distributing Zakat",
          "Al-Muallafah Qulubuhum (Those whose hearts are inclined) - New converts",
          "Ar-Riqab (Freeing Slaves) - Those seeking to free themselves",
          "Al-Gharimin (The Indebted) - Those with debts beyond ability to pay",
          "Fi Sabilillah (In the way of Allah) - Islamic causes and defense",
          "Ibnu Assabil (Wayfarers) - Travelers stranded without means"
        ]
      },
      {
        title: "Timing and Method of Zakat",
        description: "When and how to give Zakat",
        details: [
          "Due after one lunar year (Hawl) of ownership",
          "Can be calculated on Islamic calendar or Gregorian calendar (be consistent)",
          "Should be paid as soon as it becomes due",
          "Can be paid in advance if Zakat will become due soon",
          "Must be given with pure intention (Niyyah) for Allah's pleasure",
          "Can be given directly or through Islamic organizations",
          "Giving anonymously is preferable (protects dignity of receiver)",
          "Amount should be clear and accurate"
        ]
      },
      {
        title: "Who Cannot Receive Zakat",
        description: "Categories prohibited from receiving Zakat",
        details: [
          "Rich and wealthy persons",
          "Those able to work and earn",
          "Non-Muslims (unless they are the eight categories)",
          "Parents, grandparents, and ancestors of the giver",
          "Children and grandchildren of the giver",
          "Spouse of the giver",
          "Ahl-al-Bayt (family members of Prophet Muhammad ﷺ - in some conditions)"
        ]
      }
    ]
  },
  {
    id: "hajj",
    title: "Hajj (Pilgrimage)",
    arabicTitle: "الحج",
    description: "The pilgrimage to Makkah - one of the Five Pillars of Islam",
    rules: [
      {
        title: "Who Must Perform Hajj",
        description: "Conditions making Hajj obligatory",
        details: [
          "Must be Muslim - Non-Muslims cannot perform Hajj",
          "Must reach maturity - Children do not have obligation",
          "Must have sound mind - Those mentally ill are excused",
          "Must have physical ability - Can walk, ride, or be carried",
          "Must have financial means - Can afford travel and expenses",
          "Must have safe travel - No extreme danger on route",
          "Must have permission from spouse (if married)",
          "Women must have Mahram (male guardian) - To travel with them"
        ]
      },
      {
        title: "Pillars (Fard) of Hajj",
        description: "Essential rituals that must be performed",
        details: [
          "Intention (Niyyah) - Make intention to perform Hajj for Allah",
          "Ihram - Enter state of sanctity with specific dress (2 unstitched sheets for men, modest dress for women)",
          "Tawaf - Circumambulate Ka'bah 7 times counterclockwise",
          "Sa'y - Walk between Safa and Marwah mountains 7 times",
          "Wuquf at Arafah - Stand at Mount Arafah from noon to sunset on 9th Dhul-Hijjah",
          "Muzdalifah - Spend night at Muzdalifah collecting pebbles",
          "Ramy (Stoning the Pillars) - Stone three pillars at Mina",
          "Halq (Shaving) or Qasar (Trimming) - Cut hair to end Ihram state"
        ]
      },
      {
        title: "Stages of Hajj",
        description: "Sequential steps of the pilgrimage",
        details: [
          "1. Ihram - Make intention and don the sacred garments (before Miqat)",
          "2. Tawaf Al-Qudum - Initial circumambulation of Ka'bah",
          "3. Sa'y - Walk between Safa and Marwah mountains",
          "4. Traveling to Arafah - Journey to Mount Arafah",
          "5. Wuquf - Stand in meditation at Arafah from noon to sunset",
          "6. Traveling to Muzdalifah - Journey there after sunset",
          "7. Spending Night - Rest and collect pebbles at Muzdalifah",
          "8. Morning Travel to Mina - Proceed before sunrise on 10th",
          "9. Ramy - Stone the Jamrat Al-Aqabah (first pillar)",
          "10. Sacrificing Animal - Perform Qurbani (animal sacrifice)",
          "11. Halq/Qasar - Cut hair to exit Ihram state",
          "12. Tawaf Al-Ifadah - Final circumambulation of Ka'bah",
          "13. Ramy Days - Stone all three pillars on 11th and 12th (Days of Tashreeq)"
        ]
      },
      {
        title: "Prohibitions During Ihram",
        description: "Things forbidden while in state of sanctity",
        details: [
          "Men cannot wear stitched clothing or headwear",
          "Women cannot wear face veil or gloves",
          "Cutting hair or nails",
          "Perfume or fragrances",
          "Hunting or killing animals",
          "Sexual relations or lustful behavior",
          "Arguing or disputing with others",
          "Fighting or violence",
          "Disobedience to Allah or sin"
        ]
      },
      {
        title: "Days of Hajj",
        description: "Sacred timing of Hajj rituals",
        details: [
          "7th Dhul-Hijjah - Day of Tarwiyah (preparation)",
          "8th Dhul-Hijjah - Pilgrims proceed to Mina",
          "9th Dhul-Hijjah - Day of Arafah (most important day of Hajj)",
          "10th Dhul-Hijjah - Eid Al-Adha (Day of Sacrifice and Halq)",
          "11th & 12th Dhul-Hijjah - Days of Tashreeq (stoning ritual days)",
          "13th Dhul-Hijjah - Last day for stoning (optional)",
          "Whole Month - Umrah can be performed anytime in Dhul-Hijjah"
        ]
      }
    ]
  }
];

export default function Fiqh() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

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

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav title="Islamic Fiqh" subtitle="Basic Rules & Principles" theme={theme} onThemeToggle={toggleTheme} pageIcon="fiqh" />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Islamic Fiqh (Jurisprudence)</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Learn the basic rules and principles of Islamic practices
          </p>
        </div>

        <Tabs defaultValue="wudhu" className="w-full">
          <div className="overflow-x-auto mb-6">
            <TabsList className="flex w-full gap-2 p-1 bg-muted rounded-lg">
              {fiqhTopics.map((topic) => (
                <TabsTrigger
                  key={topic.id}
                  value={topic.id}
                  data-testid={`tab-${topic.id}`}
                  className="text-xs sm:text-sm whitespace-nowrap shrink-0"
                >
                  {topic.title.split(" ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {fiqhTopics.map((topic) => (
            <TabsContent key={topic.id} value={topic.id} className="space-y-4 sm:space-y-6">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold">{topic.title}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">{topic.description}</p>
                  </div>
                  <span className="font-arabic text-xl sm:text-2xl shrink-0">{topic.arabicTitle}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {topic.rules.map((rule, idx) => (
                  <Card key={idx} className="hover-elevate">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base sm:text-lg">{rule.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-1">{rule.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {rule.details && rule.details.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base mb-3">Details:</h4>
                          <ul className="space-y-2 sm:space-y-3">
                            {rule.details.map((detail, detailIdx) => (
                              <li key={detailIdx} className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                                <span className="text-primary font-semibold shrink-0 mt-0.5">•</span>
                                <span className="text-muted-foreground">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rule.conditions && rule.conditions.length > 0 && (
                        <div className="pt-2 sm:pt-4 border-t border-border">
                          <h4 className="font-semibold text-sm sm:text-base mb-3">Conditions:</h4>
                          <ul className="space-y-2 sm:space-y-3">
                            {rule.conditions.map((condition, condIdx) => (
                              <li key={condIdx} className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                                <span className="text-primary font-semibold shrink-0 mt-0.5">✓</span>
                                <span className="text-muted-foreground">{condition}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
