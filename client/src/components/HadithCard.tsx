import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hadith } from "@shared/schema";

interface HadithCardProps {
  hadith: Hadith;
}

export function HadithCard({ hadith }: HadithCardProps) {
  const collectionName = hadith.book || hadith.collection || 'Unknown';
  const hadithNum = hadith.hadithNumber || hadith.number || '1';
  
  return (
    <Card className="p-6 hover-elevate" data-testid={`hadith-card-${hadithNum}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium capitalize">
            {collectionName}
          </Badge>
          {hadith.grade && (
            <Badge variant="secondary" className="text-xs">
              {hadith.grade}
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          #{hadithNum}
        </span>
      </div>

      <div className="space-y-4">
        {hadith.arabicText && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Arabic
            </div>
            <p 
              className="font-arabic text-xl leading-loose text-right" 
              dir="rtl"
              data-testid="text-hadith-arabic"
            >
              {hadith.arabicText}
            </p>
          </div>
        )}

        {hadith.englishText && (
          <div className="pt-3 border-t border-border">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              English Translation
            </div>
            <p className="text-base leading-relaxed" data-testid="text-hadith-english">
              {hadith.englishText}
            </p>
          </div>
        )}

        {hadith.urduText && (
          <div className="pt-3 border-t border-border">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Urdu Translation
            </div>
            <p 
              className="text-base leading-relaxed" 
              dir="rtl"
              data-testid="text-hadith-urdu"
            >
              {hadith.urduText}
            </p>
          </div>
        )}

        {(hadith.narrator || hadith.reference) && (
          <div className="pt-3 border-t border-border flex flex-col gap-1">
            {hadith.narrator && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Narrator:</span> {hadith.narrator}
              </p>
            )}
            {hadith.reference && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Reference:</span> {hadith.reference}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
