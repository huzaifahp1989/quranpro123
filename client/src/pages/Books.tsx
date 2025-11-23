import { useState, useEffect, useRef } from "react";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const categories = ["Quran", "Hadith", "Tafseer", "Seerah", "Akhlaq", "Sahabah", "Kid Stories", "Other"];

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
  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [localIds, setLocalIds] = useState<Set<number>>(new Set());
  const dbRef = useRef<IDBDatabase | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState(categories[0]);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState(categories[0]);

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

  const combinedBooks: Book[] = [...localBooks, ...books];
  const booksByCategory = combinedBooks.filter(book => book.category === activeCategory);

  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (dbRef.current) return resolve(dbRef.current);
      const req = indexedDB.open('quranpro-books', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('books')) {
          const store = db.createObjectStore('books', { keyPath: 'id' });
          store.createIndex('category', 'category');
        }
      };
      req.onsuccess = () => {
        dbRef.current = req.result;
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function listLocalBooks() {
    const db = await openDB();
    return new Promise<Book[]>((resolve) => {
      const tx = db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = (req.result || []) as any[];
        const out: Book[] = rows.map(row => {
          let pdfUrl: string | undefined;
          if (row.blob && row.blob instanceof Blob) {
            try { pdfUrl = URL.createObjectURL(row.blob); } catch {}
          }
          return {
            id: row.id,
            title: row.title,
            category: row.category,
            description: row.description,
            pdfUrl,
            uploadedAt: row.uploadedAt,
          } as Book;
        });
        setLocalIds(new Set<number>(rows.map(r => r.id)));
        resolve(out);
      };
      req.onerror = () => resolve([]);
    });
  }

  async function addLocalBook(meta: { title: string; category: string; description?: string; file: File }) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const id = Date.now();
      const row = {
        id,
        title: meta.title,
        category: meta.category,
        description: meta.description || '',
        uploadedAt: new Date().toISOString(),
        blob: meta.file,
      };
      const req = store.add(row);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function updateLocalBook(id: number, updates: { title?: string; description?: string; category?: string }) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const row = getReq.result;
        if (!row) return reject(new Error('Book not found'));
        row.title = updates.title ?? row.title;
        row.description = updates.description ?? row.description;
        row.category = updates.category ?? row.category;
        const putReq = store.put(row);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async function deleteLocalBook(id: number) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const delReq = store.delete(id);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });
  }

  useEffect(() => {
    let mounted = true;
    openDB()
      .then(() => listLocalBooks())
      .then(list => { if (mounted) setLocalBooks(list); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  async function handleUpload() {
    setUploadError(null);
    setUploadSuccess(null);
    if (!uploadTitle || !uploadCategory || !uploadFile) {
      setUploadError('Please provide title, category, and select a PDF file.');
      return;
    }
    if (uploadFile.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported.');
      return;
    }
    setIsUploading(true);
    try {
      await addLocalBook({ title: uploadTitle, category: uploadCategory, description: uploadDescription, file: uploadFile });
      const list = await listLocalBooks();
      setLocalBooks(list);
      setUploadSuccess('PDF uploaded locally.');
      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload PDF.');
    } finally {
      setIsUploading(false);
    }
  }

  function toViewerUrl(raw?: string | null): string | null {
    if (!raw) return null;
    try {
      const u = new URL(raw, window.location.origin);
      const sameOrigin = u.origin === window.location.origin;
      if (sameOrigin || raw.startsWith('blob:')) return raw;
      return `/api/pdf-view?u=${encodeURIComponent(raw)}`;
    } catch {
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return `/api/pdf-view?u=${encodeURIComponent(raw)}`;
      }
      return raw;
    }
  }

  function openViewer(book: Book) {
    if (!book.pdfUrl) return;
    setViewerUrl(toViewerUrl(book.pdfUrl));
    setViewerTitle(book.title);
    setViewerOpen(true);
  }

  function openEditor(book: Book) {
    setEditId(book.id);
    setEditTitle(book.title);
    setEditDescription(book.description || "");
    setEditCategory(book.category);
    setEditOpen(true);
  }

  useEffect(() => {
    return () => {
      try {
        if (viewerUrl && viewerUrl.startsWith('blob:')) URL.revokeObjectURL(viewerUrl);
      } catch {}
    };
  }, [viewerUrl]);

  async function saveEdit() {
    if (!editId) return;
    await updateLocalBook(editId, { title: editTitle, description: editDescription, category: editCategory });
    const list = await listLocalBooks();
    setLocalBooks(list);
    setEditOpen(false);
  }

  async function removeBook(id: number) {
    await deleteLocalBook(id);
    const list = await listLocalBooks();
    setLocalBooks(list);
  }

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

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-6">
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
          <Card className="w-full md:max-w-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Upload PDF</CardTitle>
              <CardDescription className="text-xs">Store PDF locally on this device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                {categories.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
              <Input placeholder="Description (optional)" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} />
              <input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="text-xs" />
              <div className="flex gap-2 items-center">
                <Button size="sm" onClick={handleUpload} disabled={isUploading} className="gap-2">{isUploading ? 'Uploading…' : 'Upload'}</Button>
                {uploadError && <span className="text-xs text-destructive">{uploadError}</span>}
                {uploadSuccess && <span className="text-xs text-green-600">{uploadSuccess}</span>}
              </div>
              <p className="text-2xs text-muted-foreground">Note: PDFs are saved locally (IndexedDB) and visible only on this device.</p>
            </CardContent>
          </Card>
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
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => openViewer(book)}
                      >
                        View
                      </Button>
                    </div>
                  )}
                  {!book.pdfUrl && (
                    <p className="text-xs text-muted-foreground">No PDF available</p>
                  )}
                  {localIds.has(book.id) && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => openEditor(book)}>Rename</Button>
                      <Button variant="destructive" size="sm" onClick={() => removeBook(book.id)}>Delete</Button>
                    </div>
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

        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-4xl w-full">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center justify-between">
                <span>{viewerTitle}</span>
                {null}
              </DialogTitle>
            </DialogHeader>
            {viewerUrl ? (
              <div className="w-full h-[70vh]">
                <object data={viewerUrl} type="application/pdf" className="w-full h-full">
                  <iframe src={viewerUrl} className="w-full h-full" />
                </object>
                <p className="text-xs text-muted-foreground mt-2">If the PDF does not load, use "Open in tab".</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No PDF selected</p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-sm">Edit Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                {categories.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
              <Input placeholder="Description (optional)" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={saveEdit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
