import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Book, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HadithCard } from "@/components/HadithCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hadith, HadithCollection } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface HadithApiResponse {
  collection: string;
  hadiths: Hadith[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export default function HadithBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("bukhari");
  const [page, setPage] = useState(1);
  const [accumulatedHadiths, setAccumulatedHadiths] = useState<Hadith[]>([]);

  // Construct query parameters
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  if (searchQuery) {
    queryParams.set('search', searchQuery);
  }
  
  const apiUrl = `/api/hadiths/${selectedCollection}?${queryParams.toString()}`;
  
  const { data, isLoading, isFetching } = useQuery<HadithApiResponse>({
    queryKey: [apiUrl],
    enabled: selectedCollection !== "",
  });

  // Accumulate hadiths when new data arrives
  useEffect(() => {
    if (data?.hadiths) {
      if (page === 1) {
        // Reset accumulated hadiths for first page or new collection
        setAccumulatedHadiths(data.hadiths);
      } else {
        // Append new hadiths for subsequent pages
        setAccumulatedHadiths(prev => [...prev, ...data.hadiths]);
      }
    }
  }, [data, page]);

  const collections: HadithCollection[] = [
    { name: "bukhari", englishName: "Sahih al-Bukhari", numberOfHadiths: 7563 },
    { name: "muslim", englishName: "Sahih Muslim", numberOfHadiths: 7190 },
    { name: "abudawud", englishName: "Sunan Abu Dawud", numberOfHadiths: 5274 },
    { name: "tirmidhi", englishName: "Jami' At-Tirmidhi", numberOfHadiths: 3956 },
    { name: "ibnmajah", englishName: "Sunan Ibn Majah", numberOfHadiths: 4341 },
    { name: "nasai", englishName: "Sunan an-Nasa'i", numberOfHadiths: 5758 },
    { name: "malik", englishName: "Muwatta Malik", numberOfHadiths: 1826 },
  ];

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleCollectionChange = (value: string) => {
    setSelectedCollection(value);
    setPage(1); // Reset page when changing collection
    setAccumulatedHadiths([]); // Clear accumulated hadiths
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset page when searching
    setAccumulatedHadiths([]); // Clear accumulated hadiths for search
  };

  const hadiths = accumulatedHadiths;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="button-back-to-quran"
                  aria-label="Back to Quran"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Book className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Hadith Collection</h1>
                <p className="text-sm text-muted-foreground">Authentic Traditions of Prophet Muhammad ﷺ</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search hadiths..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-12"
              data-testid="input-search-hadith"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={selectedCollection} onValueChange={handleCollectionChange}>
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            {collections.map((collection) => (
              <TabsTrigger
                key={collection.name}
                value={collection.name}
                data-testid={`tab-collection-${collection.name}`}
                className="text-xs sm:text-sm"
              >
                {collection.englishName}
              </TabsTrigger>
            ))}
          </TabsList>

          {collections.map((collection) => (
            <TabsContent key={collection.name} value={collection.name}>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-6 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-20 w-full mb-4" />
                      <Skeleton className="h-16 w-full mb-3" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : hadiths && hadiths.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" data-testid="container-hadiths">
                    {hadiths.map((hadith, index) => (
                      <HadithCard key={`${hadith.book}-${hadith.hadithNumber}-${index}`} hadith={hadith} />
                    ))}
                  </div>
                  {data?.hasMore && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleLoadMore}
                        disabled={isFetching}
                        data-testid="button-load-more-hadiths"
                        variant="outline"
                        size="lg"
                      >
                        {isFetching ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More Hadiths"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  {searchQuery ? (
                    <>
                      <Search className="w-16 h-16 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium mb-2">No hadiths found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search query
                      </p>
                    </>
                  ) : (
                    <>
                      <Book className="w-16 h-16 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium mb-2">
                        {collection.englishName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {collection.numberOfHadiths} authentic hadiths
                      </p>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
