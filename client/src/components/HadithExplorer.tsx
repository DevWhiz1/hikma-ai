import { useEffect, useState } from 'react';

interface HadithHit {
  bookName?: string;
  book?: string;
  hadithNumber?: number;
  status?: string;
  textArabic?: string;
  textEnglish?: string;
  textUrdu?: string;
}

interface Book { slug: string; name: string }

const API_URL = import.meta.env.VITE_API_URL;

export default function HadithExplorer() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState('english');
  const [hits, setHits] = useState<HadithHit[]>([]);
  const [answer, setAnswer] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadBooks(); }, []);

  async function loadBooks() {
    try {
      const res = await fetch(`${API_URL}/hadith/books`, authHeader());
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBooks(data);
    } catch (e) {
      console.error(e);
    }
  }

  function authHeader() {
    const token = localStorage.getItem('token');
    return { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } } as RequestInit;
  }

  async function search() {
    setLoading(true);
    setAnswer('');
    setNotice('');
    try {
      const payload = { query, bookSlug: selectedBook, lang, pageSize: 5 };
      const sres = await fetch(`${API_URL}/hadith/hadith/search`, { method: 'POST', body: JSON.stringify(payload), ...authHeader() });
      if (!sres.ok) throw new Error(await sres.text());
      const searchResult = await sres.json();
      setHits(searchResult.hits || []);
      if (searchResult.noBookMatch) setNotice('No Hadith related to your query found in that book.');

      const ares = await fetch(`${API_URL}/hadith/answer`, { method: 'POST', body: JSON.stringify({ question: query, apiResult: searchResult }), ...authHeader() });
      const answerJson = await ares.json();
      setAnswer(answerJson.answer);
    } catch (e: any) {
      setNotice(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Hadith Explorer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Search hadith collections. Get hadith for any topic.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {books.map(b => (
          <button key={b.slug} onClick={() => setSelectedBook(sel => sel === b.slug ? null : b.slug)} className={`px-3 py-1 rounded-full text-sm border transition ${selectedBook === b.slug ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}>{b.name}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask or reference e.g. Sahih Bukhari 719" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
        <select value={lang} onChange={e => setLang(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <option value="english">English</option>
          <option value="urdu">Urdu</option>
          <option value="arabic">Arabic</option>
        </select>
        <button onClick={search} disabled={loading} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">{loading ? 'Searching...' : 'Ask'}</button>
      </div>
      {notice && <div className="text-sm text-rose-500 mb-2">{notice}</div>}
      {answer && <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 mb-4 whitespace-pre-wrap text-sm leading-relaxed">{answer}</div>}
      <div className="space-y-4">
        {hits.map((h, i) => (
          <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">{(h.bookName || h.book) || 'Unknown'} #{h.hadithNumber} {h.status && <span className="ml-2 inline-block px-2 py-0.5 rounded border border-emerald-400 text-xs">{h.status}</span>}</div>
            {h.textArabic && <div className="text-[15px] leading-relaxed mt-1">{h.textArabic}</div>}
            {h.textEnglish && <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">{h.textEnglish}</div>}
            {h.textUrdu && <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{h.textUrdu}</div>}
          </div>
        ))}
        {!loading && hits.length === 0 && answer && (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">No hadith found for your query.</div>
        )}
      </div>
    </div>
  );
}
