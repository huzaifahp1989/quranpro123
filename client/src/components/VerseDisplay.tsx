import { Badge } from "@/components/ui/badge";
import { BookmarkIcon } from "lucide-react";
import { VerseWithTranslations } from "@shared/schema";
import { cn } from "@/lib/utils";

interface VerseDisplayProps {
  verse: VerseWithTranslations;
  isHighlighted?: boolean;
  onVerseClick?: (verseNumber: number) => void;
}

export function VerseDisplay({ verse, isHighlighted, onVerseClick }: VerseDisplayProps) {
  const { ayah, urduTranslation, englishTranslation } = verse;

  return (
    <div
      className={cn(
        "group relative mb-4 p-4 sm:p-6 border-l-2 transition-all hover-elevate",
        isHighlighted 
          ? "border-l-primary bg-primary/5" 
          : "border-l-border"
      )}
      data-testid={`verse-${ayah.numberInSurah}`}
      onClick={() => onVerseClick?.(ayah.number)}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <Badge 
          variant="outline" 
          className="rounded-full h-7 w-7 flex items-center justify-center font-medium shrink-0 text-xs"
          data-testid={`badge-verse-number-${ayah.numberInSurah}`}
        >
          {ayah.numberInSurah}
        </Badge>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover-elevate"
          data-testid={`button-bookmark-${ayah.numberInSurah}`}
          aria-label="Bookmark verse"
        >
          <BookmarkIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        <div 
          className="font-arabic text-2xl sm:text-3xl leading-loose text-right" 
          dir="rtl"
          lang="ar"
          data-testid={`text-arabic-${ayah.numberInSurah}`}
        >
          {ayah.text}
        </div>

        {urduTranslation && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Urdu
              </span>
            </div>
            <p 
              className="text-base leading-relaxed text-card-foreground" 
              dir="rtl"
              data-testid={`text-urdu-${ayah.numberInSurah}`}
            >
              {urduTranslation.text}
            </p>
          </div>
        )}

        {englishTranslation && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                English
              </span>
            </div>
            <p 
              className="text-sm leading-relaxed text-card-foreground"
              data-testid={`text-english-${ayah.numberInSurah}`}
            >
              {englishTranslation.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
