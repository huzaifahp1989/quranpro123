import { useState, useEffect } from "react";
import { MessageSquare, X, Loader2, ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tafseer } from "@shared/schema";
import { cn } from "@/lib/utils";

const TAFSIR_EDITIONS = [
  { value: "en-tafisr-ibn-kathir", label: "Tafsir Ibn Kathir" },
  { value: "en-tafsir-maarif-ul-quran", label: "Maariful Quran" },
  { value: "en-al-jalalayn", label: "Tafsir Al-Jalalayn" },
  { value: "en-tafsir-ibn-abbas", label: "Tafsir Ibn Abbas" },
] as const;

const PANEL_HEIGHTS = {
  small: "25vh",
  normal: "35vh",
  large: "70vh",
} as const;

interface TafseerPanelProps {
  tafseer: Tafseer | null;
  isOpen: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  verseNumber?: number;
  surahNumber?: number;
  selectedEdition: string;
  onEditionChange: (edition: string) => void;
  error?: string | null;
}

export function TafseerPanel({ 
  tafseer, 
  isOpen, 
  onToggle, 
  isLoading, 
  verseNumber,
  surahNumber,
  selectedEdition,
  onEditionChange,
  error 
}: TafseerPanelProps) {
  const [panelSize, setPanelSize] = useState<keyof typeof PANEL_HEIGHTS>("normal");

  const handleSizeChange = (size: keyof typeof PANEL_HEIGHTS) => {
    setPanelSize(size);
  };

  return (
    <>
      {!isOpen && (
        <Button
          variant="outline"
          size="default"
          onClick={onToggle}
          className="fixed bottom-28 right-6 shadow-lg z-30"
          data-testid="button-toggle-tafseer"
          aria-label="View Tafseer"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          View Tafseer
        </Button>
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <Card className={cn("rounded-t-2xl rounded-b-none border-t border-x-0 border-b-0 flex flex-col transition-all duration-300", `h-[${PANEL_HEIGHTS[panelSize]}]`)} style={{ height: PANEL_HEIGHTS[panelSize] }}>
          <div className="flex flex-col gap-3 p-4 border-b border-card-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">
                  Tafseer {verseNumber && `- Verse ${verseNumber}`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSizeChange("small")}
                  data-testid="button-shrink-tafseer"
                  aria-label="Make smaller"
                  className={panelSize === "small" ? "bg-accent" : ""}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSizeChange("normal")}
                  data-testid="button-normal-tafseer"
                  aria-label="Normal size"
                  className={panelSize === "normal" ? "bg-accent" : ""}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSizeChange("large")}
                  data-testid="button-expand-tafseer"
                  aria-label="Make larger"
                  className={panelSize === "large" ? "bg-accent" : ""}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onToggle}
                  data-testid="button-close-tafseer"
                  aria-label="Close Tafseer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <Select value={selectedEdition} onValueChange={onEditionChange}>
              <SelectTrigger 
                className="w-full sm:w-[280px]" 
                data-testid="select-tafsir-edition"
              >
                <SelectValue placeholder="Select Tafsir Edition" />
              </SelectTrigger>
              <SelectContent>
                {TAFSIR_EDITIONS.map((edition) => (
                  <SelectItem 
                    key={edition.value} 
                    value={edition.value}
                    data-testid={`option-${edition.value}`}
                  >
                    {edition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-12 h-12 text-destructive/50 mb-3" />
                <p className="text-sm font-medium text-destructive mb-2">
                  Failed to load Tafseer
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  {error}
                </p>
              </div>
            ) : tafseer ? (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {tafseer.tafseerName}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {tafseer.language}
                  </span>
                </div>
                <div 
                  className="text-base leading-relaxed text-card-foreground prose prose-sm max-w-none"
                  data-testid="text-tafseer-content"
                  dangerouslySetInnerHTML={{ __html: tafseer.text }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a verse to view its Tafseer
                </p>
              </div>
            )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </>
  );
}
