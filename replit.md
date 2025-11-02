# Al-Quran Reading Application

## Project Overview
A comprehensive Quran reading application with audio recitation, Urdu and English translations, Tafseer (Islamic commentary), and authentic Hadith collections. Built with React, Express, and TypeScript.

## Features Implemented
- **Quran Reading**: 13-line Mushaf page layout with beautiful Arabic typography
- **Audio Recitation**: Multiple reciters (Mishary Alafasy, Abdul Basit, etc.) with synchronized playback
- **Translations**: Side-by-side Urdu and English translations for each verse
- **Tafseer**: Verse-by-verse Islamic commentary with expandable panel
- **Hadith Collection**: Browse authentic Hadith from Sahih al-Bukhari and Sahih Muslim
- **Dark Mode**: Full dark mode support with theme persistence
- **Responsive Design**: Mobile-first design with tablet and desktop optimization

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **APIs**: AlQuran Cloud API, Quran Tafseer API, Hadith APIs

## Architecture

### Data Models (shared/schema.ts)
- **Surah**: Chapter information with name, number, revelation type
- **Ayah**: Individual verses with Arabic text and audio URLs
- **Translation**: Urdu and English translations
- **Tafseer**: Verse commentary and explanation
- **Hadith**: Authentic narrations with Arabic, English, and Urdu text
- **Reciter**: Audio reciter information

### Frontend Components
1. **SurahSelector**: Dropdown with search for selecting Quran chapters
2. **VerseDisplay**: Beautiful verse cards with Arabic text and translations
3. **AudioPlayer**: Persistent audio controls with reciter selection
4. **TafseerPanel**: Expandable drawer for verse commentary
5. **HadithCard**: Card layout for Hadith display

### Pages
1. **QuranReader** (/): Main Quran reading interface
2. **HadithBrowser** (/hadith): Hadith collection browser

## API Endpoints (Backend)

### Quran Endpoints
- `GET /api/surahs` - Fetch all Quran chapters (114 surahs)
- `GET /api/surah/:surahNumber/:reciterEdition` - Fetch verses with audio and translations
- `GET /api/tafseer/:surahNumber/:ayahNumber` - Fetch Tafseer for specific verse

### Hadith Endpoints
- `GET /api/hadiths/:collection?search=query` - Fetch hadiths from specified collection
  - Collections: "bukhari", "muslim"
  - Optional search parameter for filtering

## External APIs Used

### 1. AlQuran Cloud API (http://api.alquran.cloud/v1/)
- No authentication required
- No rate limits
- Endpoints:
  - `/surah` - Get all surahs
  - `/surah/:number/editions/:edition1,:edition2,:edition3` - Get surah with multiple editions
  - Available editions:
    - `quran-uthmani` - Arabic text (Uthmani script)
    - `ar.alafasy` - Audio by Mishary Alafasy
    - `ar.abdulbasitmurattal` - Audio by Abdul Basit
    - `ur.jalandhry` - Urdu translation
    - `en.sahih` - English translation (Sahih International)

### 2. Quran Tafseer API (http://api.quran-tafseer.com/)
- No authentication required
- Endpoints:
  - `/tafseer/:tafseerID/:surahNumber/:ayahNumber`
  - Available Tafseers:
    - ID 1: التفسير الميسر (Al-Tafsir Al-Muyassar)
    - ID 2: تفسير الجلالين (Tafsir al-Jalalayn)

### 3. Hadith APIs
- Using open APIs for Sahih Bukhari and Muslim collections
- Endpoints to be configured in backend

## Design System

### Colors (Islamic Theme)
- Primary: Emerald/Teal tones (158° hue) - traditional Islamic green
- Clean, neutral backgrounds for readability
- High contrast for accessibility

### Typography
- **Arabic**: 'Amiri Quran', 'Scheherazade New' - Traditional Quranic fonts
- **Latin**: 'Inter', 'Noto Sans' - Clean, modern sans-serif
- Font sizes optimized for long reading sessions

### Spacing
- Generous padding for comfort (p-6, p-8, p-12)
- Clear verse separation (mb-6)
- Consistent gap between elements (gap-3, gap-4)

## Recent Changes
- Initial project setup with fullstack TypeScript structure
- Implemented complete frontend with all core features
- Added dark mode support with theme persistence
- Created beautiful, accessible UI following Islamic design principles
- Integrated Arabic fonts for authentic Quranic text rendering
- Implemented backend API proxy routes with caching for AlQuran Cloud API and Tafseer API
- Added audio synchronization with automatic verse advancement during playback
- Implemented robust error handling with input validation and timeout management
- Optimized layout for better reading experience with reduced spacing and compact design
- Fixed audio auto-play to maintain continuous recitation across verses

## User Guide
### Reading the Quran
1. Use the surah selector dropdown to choose a chapter
2. Read Arabic text with side-by-side Urdu and English translations
3. Click the play button to start audio recitation
4. Audio automatically advances to the next verse when playing
5. Click any verse to view its Tafseer (commentary)

### Browsing Hadith
1. Click the book icon button (bottom left) to navigate to Hadith collection
2. Choose between Sahih al-Bukhari or Sahih Muslim
3. Use the search box to find specific hadiths
4. View Arabic text with English and Urdu translations

### Dark Mode
- Click the sun/moon icon in the header to toggle between light and dark themes
- Theme preference is saved automatically

## Next Steps
1. Add bookmarking functionality for favorite verses
2. Implement reading progress tracking
3. Add more reciters and tafseer sources
4. Optimize performance with virtual scrolling for long surahs
5. Add offline support with service workers
