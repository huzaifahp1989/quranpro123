import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";

const categories = ["Quran", "Hadith", "Tafseer", "Seerah", "Akhlaq", "Sahabah", "Kid Stories"];

interface Book {
  id: number;
  title: string;
  category: string;
  description?: string;
  pdfUrl?: string;
  uploadedAt?: string;
}

export default function Books() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
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

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 1000 * 60 * 5,
  });

  const booksByCategory = books.filter(book => book.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav 
        title="Books" 
        subtitle="Islamic Knowledge Library" 
        theme={theme} 
        onThemeToggle={toggleTheme} 
        pageIcon="quran"
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Islamic Books Library</CardTitle>
            <CardDescription>Browse and download Islamic books across multiple categories</CardDescription>
          </CardHeader>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1">
            <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="text-xs sm:text-sm"
                  data-testid={`tab-category-${category.toLowerCase().replace(' ', '-')}`}
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {booksByCategory.length > 0 ? (
            booksByCategory.map((book) => (
              <Card 
                key={book.id} 
                className="flex flex-col"
                data-testid={`book-card-${book.id}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                  {book.description && (
                    <CardDescription className="line-clamp-2">{book.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground mb-4">
                    Category: {book.category}
                  </p>
                  {book.pdfUrl && (
                    <a
                      href={book.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-download-${book.id}`}
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No books in this category yet</p>
            </div>
          )}
        </div>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">About This Section</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse a comprehensive collection of Islamic books and PDFs organized by category. Access authentic Islamic knowledge including Quran studies, Hadith collections, Tafseer (interpretation), Islamic biographies (Seerah), Islamic ethics (Akhlaq), companion biographies (Sahabah), and educational stories for children.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
