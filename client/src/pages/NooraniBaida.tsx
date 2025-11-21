import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Volume2, BookOpen } from "lucide-react";

export default function NooraniBaida() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav title="Noorani Qaida" subtitle="Master Arabic Reading" theme={theme} onThemeToggle={toggleTheme} pageIcon="kids" />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Tabs defaultValue="material" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="material" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Learning Material</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>Audio Lessons</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="material" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Noorani Qaida - Complete Guide</CardTitle>
                <CardDescription>Master the Arabic alphabet and reading rules with authentic instruction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    📖 The Noorani Qaida is a foundational text for learning to read Arabic and Quranic script correctly. Work through each lesson carefully with the audio guides.
                  </p>
                </div>

                {/* PDF Viewer */}
                <div className="w-full border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex flex-col" style={{ height: 'calc(100vh - 300px)' }}>
                  <object
                    data="Noorani-Qaida-in-English-e-Book-thequranclasses.online-2_1763749316011.pdf"
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="w-full flex-1"
                  >
                    <iframe
                      src="Noorani-Qaida-in-English-e-Book-thequranclasses.online-2_1763749316011.pdf"
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                    />
                  </object>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    💡 <strong>Tip:</strong> Right-click on the PDF to download it for offline use. You can also use your browser's print function to save as PDF.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audio Lessons</CardTitle>
                <CardDescription>Learn pronunciation with authentic male voice guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-100 mb-3">
                    🎧 Audio lessons coming soon! We're preparing authentic pronunciation guides for each lesson in the Noorani Qaida.
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    While you wait, study the material above and practice the letter forms and rules. Audio will help reinforce proper pronunciation.
                  </p>
                </div>

                {/* Audio lesson placeholders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((lesson) => (
                    <div key={lesson} className="p-3 rounded-lg border border-muted hover-elevate cursor-not-allowed opacity-60">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold">Lesson {lesson}</p>
                          <p className="text-xs text-muted-foreground">Coming soon</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">How to use the audio when available:</p>
                  <ul className="text-xs space-y-2 text-muted-foreground">
                    <li>• Listen to each letter pronunciation multiple times</li>
                    <li>• Repeat after the teacher to perfect your accent</li>
                    <li>• Follow along with the written materials above</li>
                    <li>• Master one lesson before moving to the next</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
