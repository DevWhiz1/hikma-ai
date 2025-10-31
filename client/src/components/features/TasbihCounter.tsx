import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TasbihItem {
  id: string;
  name: string;
  target: number;
  count: number;
  createdAt: number;
}

interface StoredSettings {
  sound: boolean;
  voice: boolean;
}

const LS_ITEMS_KEY = 'tasbih_items_v1';
const LS_SETTINGS_KEY = 'tasbih_settings_v1';

const defaultItems: TasbihItem[] = [
  { id: 'subhanallah', name: 'SubhanAllah', target: 33, count: 0, createdAt: Date.now() },
  { id: 'alhamdulillah', name: 'Alhamdulillah', target: 33, count: 0, createdAt: Date.now() },
  { id: 'allahuakbar', name: 'Allahu Akbar', target: 34, count: 0, createdAt: Date.now() },
];

const loadItems = (): TasbihItem[] => {
  try { const raw = localStorage.getItem(LS_ITEMS_KEY); return raw ? JSON.parse(raw) : defaultItems; } catch { return defaultItems; }
};
const saveItems = (items: TasbihItem[]) => { localStorage.setItem(LS_ITEMS_KEY, JSON.stringify(items)); };

const loadSettings = (): StoredSettings => {
  try { const raw = localStorage.getItem(LS_SETTINGS_KEY); return raw ? JSON.parse(raw) : { sound: true, voice: false }; } catch { return { sound: true, voice: false }; }
};
const saveSettings = (s: StoredSettings) => localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(s));

const TasbihCounter: React.FC = () => {
  const [items, setItems] = useState<TasbihItem[]>(loadItems);
  const [activeId, setActiveId] = useState<string>(loadItems()[0]?.id || '');
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState<number>(33);
  const [settings, setSettings] = useState<StoredSettings>(loadSettings);
  const [animate, setAnimate] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const incrementBtnRef = useRef<HTMLButtonElement | null>(null);

  const activeItem = items.find(i => i.id === activeId);
  const progress = activeItem ? Math.min(activeItem.count / activeItem.target, 1) : 0;
  const percent = Math.round(progress * 100);

  // Persist settings and items
  useEffect(() => { saveItems(items); }, [items]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  // Sound generation (Vibration-like sound)
  const playVibrationSound = useCallback(() => {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440; // Base frequency (A4)
      gain.gain.value = 0.1; // Soft volume

      // Create a vibration-like effect
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
      osc.stop(now + 0.05); // Short duration to simulate a vibration
    } catch (error) {
      console.error("Error playing vibration sound:", error);
    }
  }, [settings.sound]);

  // Voice (speak milestone or completion)
  const speak = useCallback((text: string) => {
    if (!settings.voice || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 0.9; // slightly deeper
    utter.lang = 'en';
    const maleVoice = window.speechSynthesis.getVoices().find(vo => /male/i.test(vo.name)) || window.speechSynthesis.getVoices()[0];
    utter.voice = maleVoice;
    window.speechSynthesis.speak(utter);
  }, [settings.voice]);

  // Increment count and check if target is completed
  const increment = useCallback(() => {
    if (!activeItem) return;
    setItems(prev => prev.map(it => it.id === activeItem.id ? { ...it, count: it.count + 1 } : it));
    setAnimate(true);
    playVibrationSound();
    if (navigator.vibrate) navigator.vibrate(5);
    const newCount = (activeItem.count + 1);
    if (newCount === activeItem.target) {
      speak(`${activeItem.name} target completed`);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2500); // Display the celebration for 2.5 seconds
    }
  }, [activeItem, playVibrationSound, speak]);

  useEffect(() => { if (animate) { const t = setTimeout(() => setAnimate(false), 200); return () => clearTimeout(t); } }, [animate]);

  // Keyboard support (space / enter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); increment(); }
      if (e.key === 'r') { resetActive(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [increment]);

  const addDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newTarget <= 0) return;
    const id = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const item: TasbihItem = { id, name: newName.trim(), target: newTarget, count: 0, createdAt: Date.now() };
    setItems(prev => [...prev, item]);
    setActiveId(item.id);
    setNewName('');
    setNewTarget(33);
  };

  const resetActive = () => {
    if (!activeItem) return;
    setItems(prev => prev.map(it => it.id === activeItem.id ? { ...it, count: 0 } : it));
  };

  const resetAll = () => {
    if (!confirm('Reset all counts?')) return;
    setItems(prev => prev.map(it => ({ ...it, count: 0 })));
  };

  const toggleSetting = (key: keyof StoredSettings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-1/3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3 text-emerald-600 dark:text-emerald-400">Your Dhikr</h2>
          <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
            {items.map(it => {
              const pct = Math.min(it.count / it.target, 1);
              return (
                <Button
                  key={it.id}
                  onClick={() => setActiveId(it.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-center justify-between gap-3 ${
                    it.id === activeId ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-400' : 'bg-gray-50 dark:bg-gray-700/40 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="font-medium truncate">{it.name}</span>
                  <span className="text-xs tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">{it.count}/{it.target}</span>
                  <span className="flex-1 h-1 ml-2 rounded bg-gray-200 dark:bg-gray-600 overflow-hidden">
                    <span className="h-full block bg-emerald-500" style={{ width: `${pct * 100}%` }} />
                  </span>
                </Button>
              );
            })}
            {items.length === 0 && <p className="text-sm text-gray-500">No dhikr added.</p>}
          </div>
          <form onSubmit={addDhikr} className="mt-4 space-y-2">
            <input
              type="text"
              placeholder="Dhikr name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="number"
              min={1}
              value={newTarget}
              onChange={e => setNewTarget(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <Button type="submit" className="w-full">Add Dhikr</Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Button onClick={resetActive} className="px-3 py-1">Reset Current</Button>
            <Button onClick={resetAll} className="px-3 py-1" variant="destructive">Reset All</Button>
            <Button onClick={() => toggleSetting('sound')} className="px-3 py-1">{settings.sound ? 'Sound On' : 'Sound Off'}</Button>
            <Button onClick={() => toggleSetting('voice')} className="px-3 py-1">{settings.voice ? 'Voice On' : 'Voice Off'}</Button>
          </div>
        </Card>

        <Card className="flex-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {celebrate && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_70%)] animate-pulse" />}
          {activeItem ? (
            <>
              <h2 className="text-2xl font-bold mb-1 text-center text-emerald-600 dark:text-emerald-400 tracking-wide">{activeItem.name}</h2>
              <p className="text-xs mb-4 text-gray-500 dark:text-gray-400">Target {activeItem.target} • {percent}%</p>
              <div className="relative mb-8">
                <svg width={180} height={180} className="transform -rotate-90">
                  <circle cx={90} cy={90} r={80} className="stroke-gray-200 dark:stroke-gray-600" strokeWidth={10} fill="none" />
                  <circle
                    cx={90}
                    cy={90}
                    r={80}
                    stroke="currentColor"
                    className="text-emerald-500 transition-all duration-300 ease-out"
                    strokeWidth={10}
                    fill="none"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={(1 - progress) * 2 * Math.PI * 80}
                    strokeLinecap="round"
                  />
                </svg>
                <div className={`absolute inset-0 flex flex-col items-center justify-center ${animate ? 'scale-110' : 'scale-100'} transition-transform`}> 
                  <div className="text-4xl font-extrabold tabular-nums text-gray-900 dark:text-white">{activeItem.count}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">of {activeItem.target}</div>
                </div>
              </div>
              <Button
                ref={incrementBtnRef}
                onClick={increment}
                className="relative group px-14 py-14 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 transition transform shadow-xl shadow-emerald-600/30 text-white focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
              >
                <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-active:opacity-100 transition" />
                <span className="text-xl font-semibold tracking-wide drop-shadow">Dhikr</span>
              </Button>
              <p className="mt-5 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Tap / Click / Space / Enter</p>
            </>
          ) : <p className="text-gray-500">No active dhikr selected.</p>}
        </Card>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div>Progress saved locally in your browser.</div>
      </div>
    </div>
  );
};

export default TasbihCounter;
