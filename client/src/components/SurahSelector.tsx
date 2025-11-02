import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Surah } from "@shared/schema";

interface SurahSelectorProps {
  surahs: Surah[];
  selectedSurah: number;
  onSurahChange: (surahNumber: number) => void;
  isLoading?: boolean;
}

export function SurahSelector({ surahs, selectedSurah, onSurahChange, isLoading }: SurahSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSurahs = surahs.filter((surah) =>
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.name.includes(searchQuery) ||
    surah.number.toString().includes(searchQuery)
  );

  const currentSurah = surahs.find(s => s.number === selectedSurah);

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedSurah.toString()}
        onValueChange={(value) => onSurahChange(parseInt(value))}
        disabled={isLoading}
      >
        <SelectTrigger 
          className="w-full sm:w-[280px] h-11" 
          data-testid="select-surah"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <SelectValue>
              {currentSurah ? (
                <span className="flex items-center gap-2">
                  <span className="font-medium">{currentSurah.number}.</span>
                  <span className="font-arabic text-base">{currentSurah.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{currentSurah.englishName}</span>
                </span>
              ) : (
                "Select Surah"
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          <div className="p-2 sticky top-0 bg-popover z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search surah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
                data-testid="input-search-surah"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredSurahs.map((surah) => (
              <SelectItem
                key={surah.number}
                value={surah.number.toString()}
                data-testid={`option-surah-${surah.number}`}
              >
                <div className="flex items-center gap-3 py-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                    {surah.number}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-arabic text-base">{surah.name}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="font-medium">{surah.englishName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {surah.englishNameTranslation} • {surah.numberOfAyahs} verses • {surah.revelationType}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
            {filteredSurahs.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No surahs found
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
