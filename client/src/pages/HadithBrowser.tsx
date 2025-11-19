import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Book, BookOpen, Loader2, GraduationCap } from "lucide-react";
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 shrink-0">
                <Book className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold truncate">Hadith Collection</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate">Authentic Traditions of Prophet Muhammad ﷺ</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link href="/kids">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-nav-kids"
                  className="gap-1 sm:gap-2 h-8 sm:h-9"
                >
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Kids Learning</span>
                  <span className="md:hidden text-xs">Kids</span>
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-back-to-quran"
                  className="gap-1 sm:gap-2 h-8 sm:h-9"
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Read Quran</span>
                  <span className="md:hidden text-xs">Quran</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              placeholder="Search hadiths..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base"
              data-testid="input-search-hadith"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
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
                      <HadithCard key={`${hadith.collection}-${hadith.hadithNumber}-${index}`} hadith={hadith} />
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
