# Al-Quran Reading Application

## Overview
This project is a comprehensive Quran reading application featuring audio recitation, translations (Urdu and English), Tafseer (Islamic commentary), and authentic Hadith collections. It aims to provide an immersive and educational experience for users, including a dedicated section for kids' learning. The application is built with a modern web stack to ensure a responsive and accessible user interface.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The application features a mobile-first, responsive design optimized for various screen sizes. It incorporates an Islamic color scheme, primarily using Emerald/Teal tones, with clean, neutral backgrounds for high readability and accessibility. Typography uses 'Amiri Quran' and 'Scheherazade New' for Arabic text and 'Inter', 'Noto Sans' for Latin script, optimized for long reading sessions. Generous padding and clear element separation are used throughout. Full dark mode support with theme persistence is included.

### Technical Implementations
The frontend is built with React 18, TypeScript, Tailwind CSS, and Shadcn UI. State management is handled by TanStack Query, and Wouter is used for routing. The backend utilizes Express.js and Node.js. PostgreSQL (Neon) with Drizzle ORM is used for the database.

### Feature Specifications
- **Quran Reading**: 13-line Mushaf layout, audio recitation with multiple reciters, synchronized playback, click-to-play verses, repeat mode, volume control, and progress tracking. Side-by-side Urdu and English translations, and expandable Tafseer panels are available.
- **Hadith Collection**: Browse authentic Hadith from Sahih al-Bukhari and Sahih Muslim, with client-side pagination and search functionality.
- **Kids Learning Section**:
    - **Quran Recitation**: Interactive audio learning for Juz Amma, Surah Yasin, Surah Al-Mulk, and Surah Al-Waqiah, with reciter selection, verse navigation, repeat mode, and translations.
    - **Qaidah & Arabic Learning**: Comprehensive Arabic alphabet (Alif Baa) with authentic male voice pronunciation for each of the 28 letters, showing four position forms, transliteration, and pronunciation descriptions. It also includes 8 comprehensive Tajweed rules categories with Quranic examples, audio pronunciation, transliteration, and translation.

### System Design Choices
- **Data Models**: Shared Zod schemas define API response types for Surah, Ayah, Translation, Tafseer, Hadith, and Reciter. Drizzle ORM manages database tables for `users`, `bookmarks`, `reading_position`, and `user_preferences`, including unique constraints and indexes.
- **Frontend Components**: Modular components like `SurahSelector`, `VerseDisplay`, `AudioPlayer`, `TafseerPanel`, and `HadithCard` are used.
- **API Endpoints (Backend)**:
    - **Quran**: `/api/surahs` (all chapters), `/api/surah/:surahNumber/:reciterEdition` (verses, audio, translations), `/api/tafseer/:surahNumber/:ayahNumber` (verse commentary).
    - **Hadith**: `/api/hadiths/:collection?page=1&search=query` (fetch hadiths from specified collection with pagination and optional search).

## External Dependencies

- **AlQuran Cloud API**: Used for fetching Quranic text, audio, and translations.
- **Quran Tafseer API**: Provides verse-by-verse Tafseer.
- **fawazahmed0 Hadith API (via CDN)**: Integrated for authentic Hadith collections from sources like Sahih al-Bukhari and Sahih Muslim.