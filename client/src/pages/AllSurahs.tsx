import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TopNav } from "@/components/TopNav";

interface Surah {
  number: number;
  name: string;
  arabicName: string;
  ayatCount: number;
  para: string;
  revelation: "Meccan" | "Medinan";
  summary: string;
  theme: string;
}

const surahs: Surah[] = [
  { number: 1, name: "Al-Fatihah", arabicName: "الفاتحة", ayatCount: 7, para: "1", revelation: "Meccan", theme: "The Opening, Prayer", summary: "The opening chapter and foundation of Islamic prayer. A supplication for guidance, containing the core principles of Islamic faith and seeking the straight path." },
  { number: 2, name: "Al-Baqarah", arabicName: "البقرة", ayatCount: 286, para: "1-3", revelation: "Medinan", theme: "The Cow", summary: "The longest surah addressing the Muslim community's social, legal, and spiritual matters including fasting, pilgrimage, banking, family law, and moral conduct." },
  { number: 3, name: "Al-Imran", arabicName: "آل عمران", ayatCount: 200, para: "3-4", revelation: "Medinan", theme: "The Family of Imran", summary: "Discusses the family of Imran, Jesus' birth, Islamic teachings versus other faiths, and encourages steadfastness in belief and community." },
  { number: 4, name: "An-Nisa", arabicName: "النساء", ayatCount: 176, para: "4-5", revelation: "Medinan", theme: "The Women", summary: "Addresses women's rights, inheritance laws, guardianship, marriage, and social justice, establishing comprehensive principles for women's dignity and protection." },
  { number: 5, name: "Al-Maidah", arabicName: "المائدة", ayatCount: 120, para: "6-7", revelation: "Medinan", theme: "The Table", summary: "Covers lawful and unlawful food, covenant with believers, justice, and warns against those who reject faith after understanding the truth." },
  { number: 6, name: "Al-An'am", arabicName: "الأنعام", ayatCount: 165, para: "7-8", revelation: "Meccan", theme: "The Cattle", summary: "Emphasizes tawheed (monotheism), refutes polytheism, and uses examples from creation to demonstrate Allah's oneness and wisdom in creation." },
  { number: 7, name: "Al-A'raf", arabicName: "الأعراف", ayatCount: 206, para: "8-9", revelation: "Meccan", theme: "The Heights", summary: "Contains stories of prophets, the fall of Satan, and warns against arrogance, establishing the distinction between believers and disbelievers on the Day of Judgment." },
  { number: 8, name: "Al-Anfal", arabicName: "الأنفال", ayatCount: 75, para: "9-10", revelation: "Medinan", theme: "The Spoils", summary: "Addresses the Battle of Badr, war ethics, distribution of spoils, and emphasizes unity, obedience, and trust in Allah during conflict." },
  { number: 9, name: "At-Taubah", arabicName: "التوبة", ayatCount: 129, para: "10-11", revelation: "Medinan", theme: "The Repentance", summary: "Discusses the breaking of treaties, conditions of Hajj, Jizya tax, and emphasizes sincere repentance and commitment to Allah's path." },
  { number: 10, name: "Yunus", arabicName: "يونس", ayatCount: 109, para: "11-12", revelation: "Meccan", theme: "Jonah", summary: "Narrates Prophet Yunus's story, emphasizes the Quran's guidance, warns of consequences of rejection, and invites reflection on divine signs." },
  { number: 11, name: "Hud", arabicName: "هود", ayatCount: 123, para: "12", revelation: "Meccan", theme: "Hud", summary: "Contains stories of prophets sending warnings to their people, emphasizing patience, trust, and the consistent pattern of divine punishment for rejectors." },
  { number: 12, name: "Yusuf", arabicName: "يوسف", ayatCount: 111, para: "12-13", revelation: "Meccan", theme: "Joseph", summary: "The most detailed story in the Quran about Prophet Yusuf's trials, patience, and triumph, illustrating divine wisdom and justice in all circumstances." },
  { number: 13, name: "Ar-Ra'd", arabicName: "الرعد", ayatCount: 43, para: "13", revelation: "Medinan", theme: "The Thunder", summary: "Describes natural phenomena as signs of Allah's power, reassures the Prophet, and emphasizes that truth will ultimately prevail over falsehood." },
  { number: 14, name: "Ibrahim", arabicName: "إبراهيم", ayatCount: 52, para: "13-14", revelation: "Meccan", theme: "Abraham", summary: "Narrates Prophet Ibrahim's struggle against idolatry, his supplications, and the consequences of gratitude and ingratitude in individual and collective life." },
  { number: 15, name: "Al-Hijr", arabicName: "الحجر", ayatCount: 99, para: "14", revelation: "Meccan", theme: "The Rocky Tract", summary: "Addresses concerns about the Quran's revelation, mentions the destruction of past peoples, and assures the Prophet of divine protection and support." },
  { number: 16, name: "An-Nahl", arabicName: "النحل", ayatCount: 128, para: "14-15", revelation: "Meccan", theme: "The Bee", summary: "Reflects on divine blessings (livestock, honey, water) as signs of Allah's care, and emphasizes gratitude, family relations, and moral conduct." },
  { number: 17, name: "Al-Isra", arabicName: "الإسراء", ayatCount: 111, para: "15", revelation: "Meccan", theme: "The Night Journey", summary: "Describes the Prophet's night journey and ascension, emphasizing moral conduct, respect for parents, and the Quran's comprehensive guidance." },
  { number: 18, name: "Al-Kahf", arabicName: "الكهف", ayatCount: 110, para: "15-16", revelation: "Meccan", theme: "The Cave", summary: "Contains stories of the Companions of the Cave, Dhul-Qarnayn's wall, emphasizing faith's protection and the protection from trials by remembering Allah." },
  { number: 19, name: "Maryam", arabicName: "مريم", ayatCount: 98, para: "16", revelation: "Meccan", theme: "Mary", summary: "Narrates the miraculous birth of Jesus and John, emphasizing Allah's power over natural laws and the importance of prophetic lineage." },
  { number: 20, name: "Taha", arabicName: "طه", ayatCount: 135, para: "16", revelation: "Meccan", theme: "Ta Ha", summary: "Covers Prophet Musa's commission, the golden calf incident, and warns against being led astray after receiving guidance." },
  { number: 21, name: "Al-Anbiya", arabicName: "الأنبياء", ayatCount: 112, para: "17", revelation: "Meccan", theme: "The Prophets", summary: "Reviews stories of various prophets, their miraculous acts, and emphasizes the resurrection and divine justice on the Day of Judgment." },
  { number: 22, name: "Al-Hajj", arabicName: "الحج", ayatCount: 78, para: "17-18", revelation: "Medinan", theme: "The Pilgrimage", summary: "Describes Hajj rituals and their spiritual significance, encourages sacrifice for Allah, and emphasizes unity of believers from all nations." },
  { number: 23, name: "Al-Mu'minun", arabicName: "المؤمنون", ayatCount: 118, para: "18", revelation: "Meccan", theme: "The Believers", summary: "Describes the characteristics of successful believers, warns the disbelievers, and emphasizes the sequential creation of humans and divine justice." },
  { number: 24, name: "An-Nur", arabicName: "النور", ayatCount: 64, para: "18", revelation: "Medinan", theme: "The Light", summary: "Addresses personal conduct, modesty, rules for visiting homes, and contains the famous Light Verse depicting Allah's guidance as illumination." },
  { number: 25, name: "Al-Furqan", arabicName: "الفرقان", ayatCount: 77, para: "18-19", revelation: "Meccan", theme: "The Criterion", summary: "Emphasizes the Quran as the criterion distinguishing truth from falsehood, warns of the Day of Judgment, and encourages humble worship." },
  { number: 26, name: "Ash-Shuara", arabicName: "الشعراء", ayatCount: 227, para: "19-20", revelation: "Meccan", theme: "The Poets", summary: "Contains detailed stories of prophets, refutes polytheism through their narratives, and concludes with the contrast between believers and disbelievers." },
  { number: 27, name: "An-Naml", arabicName: "النمل", ayatCount: 93, para: "20", revelation: "Meccan", theme: "The Ant", summary: "Narrates Sulayman's kingdom, his dialogue with the ant, the Queen of Sheba's throne, and emphasizes gratitude and divine wisdom in governance." },
  { number: 28, name: "Al-Qasas", arabicName: "القصص", ayatCount: 88, para: "20-21", revelation: "Meccan", theme: "The Stories", summary: "Tells the comprehensive story of Prophet Musa's birth, escape, refuge, and return to Egypt, emphasizing divine providence and protection." },
  { number: 29, name: "Al-Ankabut", arabicName: "العنكبوت", ayatCount: 69, para: "21", revelation: "Meccan", theme: "The Spider", summary: "Warns that faith requires trial and patience, emphasizes the weakness of idolatry, and encourages believers to serve Allah sincerely." },
  { number: 30, name: "Ar-Rum", arabicName: "الروم", ayatCount: 60, para: "21", revelation: "Meccan", theme: "The Romans", summary: "Predicts the Byzantine victory, reflects on divine signs in creation, and emphasizes the resurrection and accountability on the Day of Judgment." },
  { number: 31, name: "Luqman", arabicName: "لقمان", ayatCount: 34, para: "21-22", revelation: "Meccan", theme: "Luqman", summary: "Contains Luqman's moral and ethical teachings to his son, emphasizing wisdom, gratitude, respect for parents, and obedience to Allah." },
  { number: 32, name: "As-Sajdah", arabicName: "السجدة", ayatCount: 30, para: "22", revelation: "Meccan", theme: "The Prostration", summary: "Describes the creation of humans in six days, emphasizes the Quran's truth, and encourages remembrance and prostration before Allah." },
  { number: 33, name: "Al-Ahzab", arabicName: "الأحزاب", ayatCount: 73, para: "22", revelation: "Medinan", theme: "The Combined Forces", summary: "Addresses the Battle of the Trench, rules for the Prophet's wives, etiquette of visiting, and the importance of obedience to the Prophet." },
  { number: 34, name: "Saba", arabicName: "سبأ", ayatCount: 54, para: "22-23", revelation: "Meccan", theme: "Sheba", summary: "Narrates the story of the People of Sheba, their destruction due to ingratitude, and emphasizes gratitude as the key to maintaining divine blessings." },
  { number: 35, name: "Fatir", arabicName: "فاطر", ayatCount: 45, para: "22-23", revelation: "Meccan", theme: "The Originator", summary: "Emphasizes Allah as the Creator of all, describes the diversity of creation as signs, and warns of consequences of rejecting guidance." },
  { number: 36, name: "Ya-Sin", arabicName: "يس", ayatCount: 83, para: "23", revelation: "Meccan", theme: "Ya Sin", summary: "Emphasizes the Quran's guidance, warns of resurrection, and contains the story of a believer calling his people to believe in the messengers." },
  { number: 37, name: "As-Saffat", arabicName: "الصافات", ayatCount: 182, para: "23-24", revelation: "Meccan", theme: "The Ranks", summary: "Praises angels in their ranks, contains stories of prophets, and warns of punishment for those who reject the message and claim falsehoods." },
  { number: 38, name: "As-Sad", arabicName: "ص", ayatCount: 88, para: "23-24", revelation: "Meccan", theme: "The Letter Sad", summary: "Contains stories of David, Solomon, and Job, emphasizes repentance and forgiveness, and warns of the final judgment and accountability." },
  { number: 39, name: "Az-Zumar", arabicName: "الزمر", ayatCount: 75, para: "24", revelation: "Meccan", theme: "The Groups", summary: "Describes people in different groups on the Day of Judgment, emphasizes sincere worship of Allah alone, and warns of false gods and partners." },
  { number: 40, name: "Ghafir", arabicName: "غافر", ayatCount: 85, para: "24", revelation: "Meccan", theme: "The Forgiver", summary: "Emphasizes Allah's forgiveness, describes the Pharaoh's believer arguing with him, and assures believers of divine support despite opposition." },
  { number: 41, name: "Fussilat", arabicName: "فصلت", ayatCount: 54, para: "24-25", revelation: "Meccan", theme: "Explained in Detail", summary: "Details the creation of earth in six days, refutes disbelievers' arguments, and emphasizes the Quran's clear signs and miracles." },
  { number: 42, name: "Ash-Shura", arabicName: "الشورى", ayatCount: 53, para: "25", revelation: "Meccan", theme: "Consultation", summary: "Emphasizes consultation in governance, warns of arrogance, and describes believers' characteristics and reward in Paradise." },
  { number: 43, name: "Az-Zukhruf", arabicName: "الزخرف", ayatCount: 89, para: "25", revelation: "Meccan", theme: "The Ornament", summary: "Warns against being distracted by worldly adornment, tells of Moses' message, and emphasizes the truth of the Quran despite disbelief." },
  { number: 44, name: "Ad-Dukhan", arabicName: "الدخان", ayatCount: 59, para: "25", revelation: "Meccan", theme: "The Smoke", summary: "Describes divine mercy and warning signs, narrates the Pharaoh's rejection, and emphasizes the Quran's clarity and the certainty of resurrection." },
  { number: 45, name: "Al-Jathiyah", arabicName: "الجاثية", ayatCount: 37, para: "25", revelation: "Meccan", theme: "The Kneeling", summary: "Reflects on creation and resurrection as signs, warns against following desires, and emphasizes the Quran as a mercy and guidance for believers." },
  { number: 46, name: "Al-Ahqaf", arabicName: "الأحقاف", ayatCount: 35, para: "26", revelation: "Meccan", theme: "The Wind Curves", summary: "Narrates the story of Hud, warns of arrogance leading to destruction, and mentions jinn believing in the Quran and warning their people." },
  { number: 47, name: "Muhammad", arabicName: "محمد", ayatCount: 38, para: "26", revelation: "Medinan", theme: "Muhammad", summary: "Addresses believers about fighting in defense of faith, warns of outcomes, and emphasizes obedience to Allah and the Prophet." },
  { number: 48, name: "Al-Fath", arabicName: "الفتح", ayatCount: 29, para: "26", revelation: "Medinan", theme: "The Victory", summary: "Announces the Treaty of Hudaybiyyah as a clear victory, emphasizes believers' commitment, and predicts the conquest of Makkah." },
  { number: 49, name: "Al-Hujurat", arabicName: "الحجرات", ayatCount: 18, para: "26", revelation: "Medinan", theme: "The Rooms", summary: "Establishes protocols for believers' conduct with the Prophet and each other, emphasizing respect, verification of news, and reconciliation." },
  { number: 50, name: "Qaf", arabicName: "ق", ayatCount: 45, para: "26-27", revelation: "Meccan", theme: "Qaf", summary: "Emphasizes the Quran's warning and mercy, depicts the Day of Resurrection vividly, and assures the Prophet of protection against disbelief." },
  { number: 51, name: "Ad-Dhariyat", arabicName: "الذاريات", ayatCount: 60, para: "27", revelation: "Meccan", theme: "The Scattering Winds", summary: "Uses natural phenomena as oaths to establish truth, narrates Abraham's story, and warns of consequences for those who reject divine signs." },
  { number: 52, name: "At-Tur", arabicName: "الطور", ayatCount: 49, para: "27", revelation: "Meccan", theme: "The Mount", summary: "Describes the Day of Judgment with vivid imagery, reassures the Prophet, and warns of punishment for the prideful and arrogant." },
  { number: 53, name: "An-Najm", arabicName: "النجم", ayatCount: 62, para: "27", revelation: "Meccan", theme: "The Star", summary: "Emphasizes the Prophet's honesty and divine guidance, warns against following desires instead of revelation, and describes accountability on the Day of Judgment." },
  { number: 54, name: "Al-Qamar", arabicName: "القمر", ayatCount: 55, para: "27-28", revelation: "Meccan", theme: "The Moon", summary: "Narrates stories of Noah, Hud, Salih, and Lot warning their peoples, describing destruction of rejectors, and the splitting of the moon as a sign." },
  { number: 55, name: "Ar-Rahman", arabicName: "الرحمن", ayatCount: 78, para: "27-28", revelation: "Medinan", theme: "The Most Merciful", summary: "Emphasizes Allah's mercy, describes Paradise and its blessings in detail, and encourages gratitude and remembrance of divine bounties." },
  { number: 56, name: "Al-Waqi'ah", arabicName: "الواقعة", ayatCount: 96, para: "27-28", revelation: "Meccan", theme: "The Inevitable", summary: "Describes the certainty of the resurrection, categorizes people into three groups on the Day of Judgment, and emphasizes the Quran's preservation." },
  { number: 57, name: "Al-Hadid", arabicName: "الحديد", ayatCount: 29, para: "28", revelation: "Medinan", theme: "The Iron", summary: "Addresses believers' roles in spreading Islam, encourages charity and spending in the way of Allah, and emphasizes faith as the foundation of action." },
  { number: 58, name: "Al-Mujadalah", arabicName: "المجادلة", ayatCount: 22, para: "28", revelation: "Medinan", theme: "The Dispute", summary: "Addresses rules for disputation and argument, establishes protocols for believers' gatherings, and emphasizes justice and truthfulness in disputes." },
  { number: 59, name: "Al-Hashr", arabicName: "الحشر", ayatCount: 24, para: "28", revelation: "Medinan", theme: "The Gathering", summary: "Describes the expulsion of a Jewish tribe, emphasizes unity among believers, and warns of learning from others' mistakes." },
  { number: 60, name: "Al-Mumtahanah", arabicName: "الممتحنة", ayatCount: 13, para: "28", revelation: "Medinan", theme: "The Woman to be Tested", summary: "Establishes rules for believers regarding relations with disbelievers, emphasizing loyalty to Allah and His Prophet over family ties." },
  { number: 61, name: "As-Saff", arabicName: "الصف", ayatCount: 14, para: "28", revelation: "Medinan", theme: "The Row", summary: "Criticizes inconsistency between saying and doing, emphasizes united action against falsehood, and mentions Jesus' prophecy of the Prophet Muhammad." },
  { number: 62, name: "Al-Jumu'ah", arabicName: "الجمعة", ayatCount: 11, para: "28", revelation: "Medinan", theme: "The Congregation", summary: "Emphasizes the importance of Friday prayer congregation, warns against preoccupation with worldly matters, and encourages seeking knowledge from Allah." },
  { number: 63, name: "Al-Munafiqun", arabicName: "المنافقون", ayatCount: 11, para: "28", revelation: "Medinan", theme: "The Hypocrites", summary: "Exposes the characteristics of hypocrites, warns believers against their deception, and emphasizes sincerity and dedication to Allah's cause." },
  { number: 64, name: "At-Taghabun", arabicName: "التغابن", ayatCount: 18, para: "28-29", revelation: "Medinan", theme: "The Mutual Deception", summary: "Describes the Day of Judgment as mutual loss and gain for believers and disbelievers, encourages family kindness, and emphasizes obedience to Allah." },
  { number: 65, name: "At-Talaq", arabicName: "الطلاق", ayatCount: 12, para: "28-29", revelation: "Medinan", theme: "The Divorce", summary: "Establishes legal procedures and ethics for divorce, emphasizes reconciliation, and addresses women's and men's rights during marital separation." },
  { number: 66, name: "At-Tahrim", arabicName: "التحريم", ayatCount: 12, para: "29", revelation: "Medinan", theme: "The Prohibition", summary: "Addresses an incident between the Prophet and his wives, establishes rules against false oaths, and emphasizes obedience and family unity." },
  { number: 67, name: "Al-Mulk", arabicName: "الملك", ayatCount: 30, para: "29", revelation: "Meccan", theme: "The Dominion", summary: "Emphasizes Allah's sovereignty and perfect creation, warns of resurrection and accountability, and encourages reflection on divine wisdom in creation." },
  { number: 68, name: "Al-Qalam", arabicName: "القلم", ayatCount: 52, para: "29", revelation: "Meccan", theme: "The Pen", summary: "Defends the Prophet's character against accusations, warns of severe punishment for the arrogant, and encourages moral character and truthfulness." },
  { number: 69, name: "Al-Haqqah", arabicName: "الحاقة", ayatCount: 52, para: "29", revelation: "Meccan", theme: "The Reality", summary: "Describes the terrible Day of Judgment, warns of punishment for rejectors, and emphasizes the certainty of resurrection and divine justice." },
  { number: 70, name: "Al-Ma'arij", arabicName: "المعارج", ayatCount: 44, para: "29", revelation: "Meccan", theme: "The Ways of Ascent", summary: "Describes the Day of Resurrection with vivid imagery, emphasizes human ingratitude and haste, and highlights the virtues of patient believers." },
  { number: 71, name: "Nuh", arabicName: "نوح", ayatCount: 28, para: "29", revelation: "Meccan", theme: "Noah", summary: "Presents Noah's preaching and rejection by his people for 950 years, emphasizes perseverance in calling to Allah despite opposition." },
  { number: 72, name: "Al-Jinn", arabicName: "الجن", ayatCount: 28, para: "29-30", revelation: "Meccan", theme: "The Jinn", summary: "Describes jinn listening to the Quran and believing, warns of protection through Quranic recitation, and emphasizes Allah's guidance and justice." },
  { number: 73, name: "Al-Muzzammil", arabicName: "المزمل", ayatCount: 20, para: "29-30", revelation: "Meccan", theme: "The Enveloped One", summary: "Commands night prayer and Quran recitation, warns of severe punishment for rejectors, and emphasizes patience and trust in Allah." },
  { number: 74, name: "Al-Muddaththir", arabicName: "المدثر", ayatCount: 56, para: "29-30", revelation: "Meccan", theme: "The Cloaked One", summary: "Describes the Prophet's commission and initial revelation, warns of Hell's severity, and emphasizes the Quran's certainty and divine origin." },
  { number: 75, name: "Al-Qiyamah", arabicName: "القيامة", ayatCount: 40, para: "30", revelation: "Meccan", theme: "The Resurrection", summary: "Emphasizes the certainty of resurrection and the Final Day, warns against swearing false oaths, and describes the certainty of accountability." },
  { number: 76, name: "Al-Insan", arabicName: "الإنسان", ayatCount: 31, para: "30", revelation: "Medinan", theme: "The Human", summary: "Describes the creation of humans and their choice of gratitude or ingratitude, emphasizes Paradise's rewards for the righteous and believers." },
  { number: 77, name: "Al-Mursalat", arabicName: "المرسلات", ayatCount: 50, para: "30", revelation: "Meccan", theme: "Those Sent Forth", summary: "Uses oaths to establish the reality of the Day of Judgment, warns of Hell's punishment, and emphasizes belief in the afterlife." },
  { number: 78, name: "An-Naba'", arabicName: "النبأ", ayatCount: 40, para: "30", revelation: "Meccan", theme: "The Great News", summary: "Announces the Day of Judgment, describes creation and day/night cycle as signs, and warns of eternal consequences for rejectors and believers alike." },
  { number: 79, name: "An-Nazi'at", arabicName: "الناع", ayatCount: 46, para: "30", revelation: "Meccan", theme: "Those Who Pull Out", summary: "Describes the escaping of souls at death, narrates Moses and Pharaoh's story, and warns of the Day of Judgment's reality." },
  { number: 80, name: "'Abasa", arabicName: "عبس", ayatCount: 42, para: "30", revelation: "Meccan", theme: "He Frowned", summary: "Teaches the Prophet not to turn away a blind believer seeking knowledge, emphasizing that all are equally worthy of guidance and respect." },
  { number: 81, name: "At-Takwir", arabicName: "التكوير", ayatCount: 29, para: "30", revelation: "Meccan", theme: "The Darkening", summary: "Describes cosmic events at the end of the world, emphasizes the Quran as a trustworthy revelation, and warns of the Day of Judgment." },
  { number: 82, name: "Al-Infitar", arabicName: "الإنفطار", ayatCount: 19, para: "30", revelation: "Meccan", theme: "The Splitting", summary: "Describes the Day of Judgment's events, mentions recording angels, and warns of accountability for all deeds before Allah." },
  { number: 83, name: "Al-Mutaffifin", arabicName: "المطففين", ayatCount: 36, para: "30", revelation: "Meccan", theme: "The Cheaters", summary: "Warns against cheating in business and measurements, describes the punishment of the dishonest, and emphasizes the rewards of the righteous." },
  { number: 84, name: "Al-Inshiqaq", arabicName: "الإنشقاق", ayatCount: 25, para: "30", revelation: "Meccan", theme: "The Splitting Asunder", summary: "Describes cosmic transformations on the Day of Judgment, emphasizes every soul's knowledge of its deeds, and warns of accountability." },
  { number: 85, name: "Al-Buruj", arabicName: "البروج", ayatCount: 22, para: "30", revelation: "Meccan", theme: "The Constellations", summary: "Narrates the story of believers in the ditch persecuted for their faith, warns of divine punishment for oppressors, and emphasizes Allah's protection." },
  { number: 86, name: "At-Tariq", arabicName: "الطارق", ayatCount: 17, para: "30", revelation: "Meccan", theme: "The Night Comer", summary: "Emphasizes each soul's accountability for its deeds, warns of the reality of resurrection, and assures believers of divine remembrance." },
  { number: 87, name: "Al-A'la", arabicName: "الأعلى", ayatCount: 19, para: "30", revelation: "Meccan", theme: "The Most High", summary: "Praises Allah's majesty and creation, encourages remembrance and purification, and assures Paradise for those who believe and do good." },
  { number: 88, name: "Al-Ghashiyah", arabicName: "الغاشية", ayatCount: 26, para: "30", revelation: "Meccan", theme: "The Overwhelming", summary: "Describes the Day of Judgment's overwhelming nature, contrasts the fates of believers and disbelievers, and emphasizes the Quran's warning." },
  { number: 89, name: "Al-Fajr", arabicName: "الفجر", ayatCount: 30, para: "30", revelation: "Meccan", theme: "The Dawn", summary: "Uses historical examples of destroyed peoples to warn disbelievers, emphasizes soul's accountability, and promises Paradise for the righteous." },
  { number: 90, name: "Al-Balad", arabicName: "البلد", ayatCount: 20, para: "30", revelation: "Meccan", theme: "The City", summary: "Describes the path to Paradise through spending wealth and freeing slaves, emphasizes difficulty of achieving righteousness, and warns of Hell." },
  { number: 91, name: "Ash-Shams", arabicName: "الشمس", ayatCount: 15, para: "30", revelation: "Meccan", theme: "The Sun", summary: "Uses celestial bodies and creation as signs of Allah's wisdom, emphasizes the soul's choice of piety or sin, and warns of consequences." },
  { number: 92, name: "Al-Layl", arabicName: "الليل", ayatCount: 21, para: "30", revelation: "Meccan", theme: "The Night", summary: "Contrasts the rewards of spending for Allah's sake with the punishment of hoarding, emphasizes guidance available to all willing to receive it." },
  { number: 93, name: "Ad-Duha", arabicName: "الضحى", ayatCount: 11, para: "30", revelation: "Meccan", theme: "The Morning Brightness", summary: "Consoles the Prophet during a period of silence in revelation, emphasizes Allah's care and provision, and encourages generosity to the needy." },
  { number: 94, name: "Ash-Sharh", arabicName: "الشرح", ayatCount: 8, para: "30", revelation: "Meccan", theme: "The Opening Up", summary: "Emphasizes Allah's easing of difficulties for the Prophet, encourages reliance on Allah, and assures divine help in all endeavors." },
  { number: 95, name: "At-Tin", arabicName: "التين", ayatCount: 8, para: "30", revelation: "Meccan", theme: "The Fig", summary: "Honors the sacred geography of revelation, emphasizes human dignity, and warns of accountability for those who deny divine guidance." },
  { number: 96, name: "Al-Alaq", arabicName: "العلق", ayatCount: 19, para: "30", revelation: "Meccan", theme: "The Clot", summary: "The first revelation to the Prophet emphasizing knowledge and creation, commands reading and learning, and warns of arrogance and denial." },
  { number: 97, name: "Al-Qadr", arabicName: "القدر", ayatCount: 5, para: "30", revelation: "Meccan", theme: "The Power", summary: "Emphasizes the greatness of Laylat Al-Qadr (Night of Power), describes angels' descending with blessings, and promises peace and mercy." },
  { number: 98, name: "Al-Bayyinah", arabicName: "البينة", ayatCount: 8, para: "30", revelation: "Medinan", theme: "The Clear Proof", summary: "Emphasizes the clarity of the Quran as proof, describes believers' reward and disbelievers' punishment, and emphasizes truth's clarity." },
  { number: 99, name: "Az-Zilzal", arabicName: "الزلزال", ayatCount: 8, para: "30", revelation: "Medinan", theme: "The Earthquake", summary: "Describes the earth's shaking on the Day of Judgment, emphasizes accountability for deeds, and warns that all will see results of actions." },
  { number: 100, name: "Al-Adiyat", arabicName: "العاديات", ayatCount: 11, para: "30", revelation: "Meccan", theme: "The Courser", summary: "Uses oath about galloping horses to emphasize ingratitude, warns of divine punishment, and emphasizes witnessing of deeds." },
  { number: 101, name: "Al-Qari'ah", arabicName: "القارعة", ayatCount: 11, para: "30", revelation: "Meccan", theme: "The Calamity", summary: "Describes the terrifying events of the Day of Judgment, emphasizes the lightness of good deeds will determine eternal fate." },
  { number: 102, name: "At-Takathur", arabicName: "التكاثر", ayatCount: 8, para: "30", revelation: "Meccan", theme: "The Rivalry in Abundance", summary: "Warns against preoccupation with worldly competition and material accumulation, emphasizes perspective on death and accountability." },
  { number: 103, name: "Al-Asr", arabicName: "العصر", ayatCount: 3, para: "30", revelation: "Meccan", theme: "The Time", summary: "Among the shortest surahs, emphasizes that humans are in loss except believers who do good deeds and remain patient in truth." },
  { number: 104, name: "Al-Humazah", arabicName: "الهمزة", ayatCount: 9, para: "30", revelation: "Meccan", theme: "The Backbiter", summary: "Warns against backbiting and mocking others, describes punishment in Hell for the slanderous, and emphasizes dignity of all believers." },
  { number: 105, name: "Al-Fil", arabicName: "الفيل", ayatCount: 5, para: "30", revelation: "Meccan", theme: "The Elephant", summary: "Narrates the historical event when Abraha's army with elephants attacked Makkah, describes divine intervention to protect the Ka'bah." },
  { number: 106, name: "Quraysh", arabicName: "قريش", ayatCount: 4, para: "30", revelation: "Meccan", theme: "Quraysh", summary: "Reminds Quraysh of Allah's care and provision through trade, encourages gratitude, and implies obligation to worship Allah alone." },
  { number: 107, name: "Al-Ma'un", arabicName: "الماعون", ayatCount: 7, para: "30", revelation: "Meccan", theme: "The Assistance", summary: "Criticizes those who neglect prayer and withhold charity, emphasizes small acts of kindness, and encourages social responsibility." },
  { number: 108, name: "Al-Kawthar", arabicName: "الكوثر", ayatCount: 3, para: "30", revelation: "Meccan", theme: "The Abundance", summary: "Assures the Prophet of abundance and blessings, encourages prayer, and describes the river of Kawthar in Paradise." },
  { number: 109, name: "Al-Kafirun", arabicName: "الكافرون", ayatCount: 6, para: "30", revelation: "Meccan", theme: "The Disbelievers", summary: "Establishes clear separation from disbelievers' beliefs, maintains respect while rejecting false worship, emphasizes religious freedom and choice." },
  { number: 110, name: "An-Nasr", arabicName: "النصر", ayatCount: 3, para: "30", revelation: "Medinan", theme: "The Succor", summary: "Announces victory in Makkah's conquest, encourages celebration through prayer and gratitude, and marks the Prophet's final spiritual message." },
  { number: 111, name: "Al-Masad", arabicName: "المسد", ayatCount: 5, para: "30", revelation: "Meccan", theme: "The Flame", summary: "Warns the Prophet's uncle Abu Lahab of punishment, emphasizes divine justice against arrogance and opposition to the Prophet." },
  { number: 112, name: "Al-Ikhlas", arabicName: "الإخلاص", ayatCount: 4, para: "30", revelation: "Meccan", theme: "The Sincerity", summary: "Defines Allah's oneness and perfection, denies any partnership or comparison, emphasizes pure monotheism as foundation of faith." },
  { number: 113, name: "Al-Falaq", arabicName: "الفلق", ayatCount: 5, para: "30", revelation: "Meccan", theme: "The Daybreak", summary: "Seeks refuge in Allah from evils of darkness and creation, emphasizes divine protection against unseen harms and negative influences." },
  { number: 114, name: "An-Nas", arabicName: "الناس", ayatCount: 6, para: "30", revelation: "Meccan", theme: "The Mankind", summary: "Seeks refuge in Allah from the Devil's whispers, emphasizes divine protection and guidance for all mankind against evil influences." }
];

export default function AllSurahs() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
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

  const filteredSurahs = surahs.filter(surah =>
    surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.arabicName.includes(searchQuery) ||
    surah.number.toString().includes(searchQuery) ||
    surah.theme.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNav title="All Surahs" subtitle="114 Chapters of the Quran" theme={theme} onThemeToggle={toggleTheme} />
      
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              placeholder="Search Surah by name, number, or theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base"
              data-testid="input-search-surahs"
            />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">The 114 Surahs of the Quran</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Complete summaries of all chapters • {filteredSurahs.length} results found
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredSurahs.map((surah) => (
            <Card key={surah.number} className="hover-elevate cursor-pointer transition-all p-3 sm:p-4">
              <div className="mb-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold">{surah.number}. {surah.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{surah.theme}</p>
                  </div>
                  <span className="font-arabic text-lg sm:text-xl shrink-0">{surah.arabicName}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3 text-xs">
                  <span className="bg-primary/10 px-2 py-1 rounded">{surah.ayatCount} Ayat</span>
                  <span className="bg-primary/10 px-2 py-1 rounded">Para {surah.para}</span>
                  <span className={`px-2 py-1 rounded ${surah.revelation === 'Meccan' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                    {surah.revelation}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {surah.summary}
              </p>
            </Card>
          ))}
        </div>

        {filteredSurahs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No Surahs found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
