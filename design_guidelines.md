# Quran Reading Application - Design Guidelines

## Design Approach

**System-Based Approach** with Islamic app best practices (inspired by Quran.com, Ayah app patterns)

This is a utility-focused reading and study application where clarity, readability, and accessibility are paramount. The design prioritizes content hierarchy, comfortable reading experience, and intuitive navigation over visual flourishes.

## Design Principles

1. **Sacred Content First**: Arabic text receives primary visual hierarchy
2. **Reading Comfort**: Optimized for extended study sessions
3. **Clarity Over Decoration**: Minimal distractions from the content
4. **Respectful Aesthetics**: Clean, dignified presentation appropriate for religious texts

## Typography System

### Arabic Text (Quran)
- **Font Family**: 'Amiri Quran' or 'Scheherazade New' via Google Fonts (traditional Arabic typography optimized for Quranic text)
- **Primary Reading Size**: text-2xl to text-3xl (1.5rem to 1.875rem)
- **Line Height**: leading-loose (2.0) for comfortable Arabic reading
- **Direction**: RTL (right-to-left) for Arabic content
- **Alignment**: text-right for Arabic, text-justify for optimal spacing

### Translations & Secondary Text
- **Font Family**: 'Inter' or 'Noto Sans' via Google Fonts
- **Translation Text**: text-base to text-lg (1rem to 1.125rem)
- **Labels & UI**: text-sm (0.875rem)
- **Headings**: text-xl to text-2xl with font-semibold

### Tafseer & Hadith
- **Font Family**: Same as translations (Inter/Noto Sans)
- **Body Text**: text-base with leading-relaxed
- **Attribution**: text-sm with font-medium

## Layout System

**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16
- Tight spacing: p-3, gap-3 (for compact UI elements)
- Standard spacing: p-4, p-6, gap-4 (for content sections)
- Generous spacing: p-8, p-12, py-16 (for main content areas)

### 13-Line Mushaf Page Layout
- **Container**: max-w-4xl mx-auto (centered reading experience)
- **Page Padding**: px-6 py-8 on mobile, px-12 py-12 on desktop
- **Verse Spacing**: mb-6 between verses
- **Line Height**: Precisely calculated to display 13 lines of Arabic text per page

### Three-Panel Reading Layout
```
┌─────────────────────────────────────┐
│      Header (Surah Info + Audio)   │
├─────────────────────────────────────┤
│                                     │
│    ┌──────────────────────────┐    │
│    │   Arabic Text (13-line)  │    │ Main Content Area
│    │   ----------------       │    │ (scrollable)
│    │   Translation (Urdu)     │    │
│    │   Translation (English)  │    │
│    └──────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│    Tafseer/Hadith Drawer (toggled) │
└─────────────────────────────────────┘
```

### Responsive Breakpoints
- Mobile (< 768px): Single column, stacked layout
- Tablet (768px - 1024px): Comfortable reading width
- Desktop (> 1024px): Optimal reading width with side navigation

## Component Library

### Navigation Components
**Top App Bar**
- Sticky header with z-index-50
- Contains: Surah selector dropdown, page number indicator, settings icon
- Height: h-16
- Padding: px-4 py-3

**Surah Selector**
- Dropdown menu with surah names (Arabic + transliteration + English)
- Search functionality for quick navigation
- Grouped by Juz (parts) for easier browsing

### Reading Components
**Verse Container**
- Border-l-4 for verse number indication
- Padding: p-4 to p-6
- Margin bottom: mb-6 between verses
- Background: Subtle hover state for interactivity

**Arabic Text Display**
- Font size: text-2xl to text-3xl
- Line spacing: leading-loose
- Clear verse number badges (rounded-full with subtle background)

**Translation Cards**
- Stacked layout below Arabic text
- Label indicators: "Urdu Translation" / "English Translation" in text-sm font-medium
- Padding: p-4
- Border-t for visual separation

### Audio Player
**Persistent Audio Bar**
- Fixed bottom position or sticky below header
- Controls: Previous verse, Play/Pause, Next verse, Speed control, Reciter selection
- Progress bar showing current playback position
- Verse highlighting synchronized with audio playback
- Height: h-20
- Full width with max-w-4xl mx-auto to match content

**Reciter Selection**
- Dropdown with popular reciters: Mishary Alafasy, Abdul Basit, Saad Al-Ghamdi
- Icon indicators for different recitation styles

### Study Components
**Tafseer Panel**
- Expandable drawer or modal
- Toggle button: "View Tafseer" icon button
- Content: Verse-by-verse commentary
- Padding: p-6
- Max height with scroll for long content

**Hadith Integration**
- Separate tab or section
- Search by keyword
- Collection filters: Sahih Bukhari, Sahih Muslim
- Card-based layout for hadith entries
- Arabic text with translation side-by-side

### Interactive Elements
**Buttons**
- Primary actions: px-6 py-3 with rounded-lg
- Icon buttons: p-3 with rounded-full for audio controls
- Text buttons for secondary actions: px-4 py-2

**Form Inputs**
- Search fields: h-12 with px-4, rounded-lg borders
- Dropdowns: Custom select with clear labels
- Consistent focus states with ring-2

## Page Structure

### Main Reading View
1. **Header Section** (fixed/sticky)
   - Surah name in both Arabic and English
   - Verse range indicator
   - Audio controls
   
2. **Content Section** (scrollable)
   - 13-line Mushaf page view
   - Arabic verses with clear verse numbers
   - Urdu translation immediately below each verse
   - English translation below Urdu
   - Subtle dividers between verses
   
3. **Action Bar** (sticky)
   - Bookmark current page
   - Share verse
   - Tafseer toggle
   - Settings

4. **Footer Drawer** (collapsible)
   - Tafseer content when activated
   - Hadith search when activated

### Hadith Collection View
- Sidebar navigation with collections (Bukhari, Muslim)
- Main content area with search
- Card grid for hadith entries (grid-cols-1 md:grid-cols-2)
- Each card: Arabic text, translation, reference, grade

## Accessibility & Usability

- All interactive elements minimum touch target: 44x44px (h-11 w-11 minimum)
- Clear focus indicators with ring-2 for keyboard navigation
- ARIA labels for screen readers on all controls
- High contrast ratios for text readability
- Text resizing support without breaking layout
- Skip links for keyboard users to jump to main content

## Icons

**Library**: Heroicons via CDN
- Audio controls: play-circle, pause-circle, forward, backward
- Navigation: chevron-left, chevron-right, bars-3
- Actions: bookmark, share, cog-6-tooth, magnifying-glass
- Content: book-open, chat-bubble-left-ellipsis (for tafseer)

## Images

No hero images required. This is a utility application focused on text content. All visual elements serve functional purposes:
- Surah header decorative patterns (optional subtle SVG borders)
- Placeholder for verse number indicators (circular badges)

The design emphasizes typography, spacing, and content hierarchy over imagery.