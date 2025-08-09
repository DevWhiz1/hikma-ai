import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  Settings2,
} from "lucide-react";
import {
  CalculationMethod,
  Coordinates,
  PrayerTimes,
  Madhab,
  HighLatitudeRule,
  CalculationParameters,
} from "adhan";

type MethodKey =
  | "MWL"
  | "ISNA"
  | "Egyptian"
  | "Karachi"
  | "UmmAlQura"
  | "Moonsighting"
  | "Turkey"
  | "Dubai"
  | "Kuwait"
  | "Qatar";

type HighLatKey = "MiddleOfTheNight" | "SeventhOfTheNight" | "TwilightAngle";
type MadhabKey = "Shafi" | "Hanafi";

interface Location {
  latitude: number;
  longitude: number;
  city?: string;
}

const methodOptions: { key: MethodKey; label: string }[] = [
  { key: "MWL", label: "Muslim World League" },
  { key: "ISNA", label: "ISNA (North America)" },
  { key: "Egyptian", label: "Egyptian" },
  { key: "Karachi", label: "Karachi" },
  { key: "UmmAlQura", label: "Umm al-Qura" },
  { key: "Moonsighting", label: "Moonsighting Committee" },
  { key: "Turkey", label: "Turkey" },
  { key: "Dubai", label: "Dubai" },
  { key: "Kuwait", label: "Kuwait" },
  { key: "Qatar", label: "Qatar" },
];

const highLatOptions: { key: HighLatKey; label: string }[] = [
  { key: "MiddleOfTheNight", label: "Middle of the Night" },
  { key: "SeventhOfTheNight", label: "Seventh of the Night" },
  { key: "TwilightAngle", label: "Twilight Angle" },
];

const madhabOptions: { key: MadhabKey; label: string }[] = [
  { key: "Shafi", label: "Shafi" },
  { key: "Hanafi", label: "Hanafi" },
];

function getParams(method: MethodKey): CalculationParameters {
  switch (method) {
    case "MWL":
      return CalculationMethod.MuslimWorldLeague();
    case "ISNA":
      return CalculationMethod.NorthAmerica();
    case "Egyptian":
      return CalculationMethod.Egyptian();
    case "Karachi":
      return CalculationMethod.Karachi();
    case "UmmAlQura":
      return CalculationMethod.UmmAlQura();
    case "Moonsighting":
      return CalculationMethod.MoonsightingCommittee();
    case "Turkey":
      return CalculationMethod.Turkey();
    case "Dubai":
      return CalculationMethod.Dubai();
    case "Kuwait":
      return CalculationMethod.Kuwait();
    case "Qatar":
      return CalculationMethod.Qatar();
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

function formatTime(d: Date, use24h: boolean) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: !use24h,
  }).format(d);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
interface PrayerEntry {
  key: PrayerKey;
  label: string;
  time: Date;
}

function entriesFromTimes(times: PrayerTimes): PrayerEntry[] {
  return [
    { key: "Fajr", label: "Fajr", time: times.fajr },
    { key: "Sunrise", label: "Sunrise", time: times.sunrise },
    { key: "Dhuhr", label: "Dhuhr", time: times.dhuhr },
    { key: "Asr", label: "Asr", time: times.asr },
    { key: "Maghrib", label: "Maghrib", time: times.maghrib },
    { key: "Isha", label: "Isha", time: times.isha },
  ];
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

export default function PrayerTimesPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);

  const [method, setMethod] = useState<MethodKey>("MWL");
  const [madhab, setMadhab] = useState<MadhabKey>("Shafi");
  const [highLat, setHighLat] = useState<HighLatKey>("TwilightAngle");
  const [use24h, setUse24h] = useState(false);

  const [tick, setTick] = useState<number>(Date.now());
  const tickRef = useRef<number | null>(null);

  // Live ticking for countdown/progress
  useEffect(() => {
    const id = setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      if (!navigator.geolocation) throw new Error("Geolocation not supported");

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      const loc: Location = { latitude, longitude };

      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await res.json();
        loc.city = data.city || data.locality || data.principalSubdivision || "Unknown Location";
      } catch {
        loc.city = "Unknown Location";
      }

      setLocation(loc);
      setMessage({ type: "success", text: `Using location for ${loc.city}.` });
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Please enable location access to show prayer times." });
    } finally {
      setIsLoading(false);
    }
  };

  const params = useMemo(() => {
    const p = getParams(method);
    p.madhab = madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
    p.highLatitudeRule =
      highLat === "MiddleOfTheNight"
        ? HighLatitudeRule.MiddleOfTheNight
        : highLat === "SeventhOfTheNight"
        ? HighLatitudeRule.SeventhOfTheNight
        : HighLatitudeRule.TwilightAngle;
    return p;
  }, [method, madhab, highLat]);

  const todayTimes = useMemo(() => {
    if (!location) return null;
    const coords = new Coordinates(location.latitude, location.longitude);
    return new PrayerTimes(coords, new Date(), params);
  }, [location, params, tick]);

  const yesterdayTimes = useMemo(() => {
    if (!location) return null;
    const coords = new Coordinates(location.latitude, location.longitude);
    return new PrayerTimes(coords, addDays(new Date(), -1), params);
  }, [location, params, tick]);

  const tomorrowTimes = useMemo(() => {
    if (!location) return null;
    const coords = new Coordinates(location.latitude, location.longitude);
    return new PrayerTimes(coords, addDays(new Date(), 1), params);
  }, [location, params, tick]);

  const entries = useMemo(() => {
    if (!todayTimes) return [];
    return entriesFromTimes(todayTimes);
  }, [todayTimes]);

  const now = new Date(tick);
  const nextPrev = useMemo(() => {
    if (!todayTimes || !yesterdayTimes || !tomorrowTimes) return null;

    const today = entriesFromTimes(todayTimes);
    const yest = entriesFromTimes(yesterdayTimes);
    const tomo = entriesFromTimes(tomorrowTimes);

    let next: PrayerEntry | null = null;
    let prev: PrayerEntry | null = null;

    for (let i = 0; i < today.length; i++) {
      if (today[i].time.getTime() > now.getTime()) {
        next = today[i];
        prev = i > 0 ? today[i - 1] : yest[yest.length - 1];
        break;
      }
    }
    if (!next) {
      // after Isha
      next = tomo[0]; // Fajr tomorrow
      prev = today[today.length - 1]; // Isha today
    }

    return { next, prev };
  }, [todayTimes, yesterdayTimes, tomorrowTimes, now]);

  const countdownMs = useMemo(() => {
    if (!nextPrev) return 0;
    return nextPrev.next.time.getTime() - now.getTime();
  }, [nextPrev, now]);

  const progress = useMemo(() => {
    if (!nextPrev) return 0;
    const start = nextPrev.prev.time.getTime();
    const end = nextPrev.next.time.getTime();
    const p = (now.getTime() - start) / (end - start);
    return Math.max(0, Math.min(1, p));
  }, [nextPrev, now]);

  const tzStr = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "-";
    const hh = Math.floor(Math.abs(offsetMin) / 60);
    const mm = Math.abs(offsetMin) % 60;
    return `${tz} (GMT${sign}${pad(hh)}:${pad(mm)})`;
  }, [tick]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white p-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Prayer Times</h1>
          <p className="text-slate-500">Daily timings based on your location and preferred method</p>
        </div>

        {message && (
          <div
            className={[
              "mb-6 rounded-lg border px-4 py-3 text-sm",
              message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
              message.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
              message.type === "info" && "border-slate-200 bg-slate-50 text-slate-700",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Left: Summary + Countdown */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 opacity-90" />
                  <div className="text-sm">
                    <div className="font-medium">{location?.city ?? "Location not set"}</div>
                    <div className="text-white/80">
                      {location
                        ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                        : "Click Get My Location"}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/90">{tzStr}</div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Countdown Ring */}
                <div className="flex items-center justify-center">
                  <div className="relative w-44 h-44">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#10b981 ${Math.round(progress * 360)}deg, #e5e7eb 0deg)`,
                        transition: "background 0.6s linear",
                      }}
                    />
                    <div className="absolute inset-2 rounded-full bg-white border border-slate-200 shadow-inner" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-xs text-slate-500">Next Prayer</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {nextPrev?.next.label ?? "--"}
                      </div>
                      <div className="text-emerald-600 font-mono text-xl">
                        {formatCountdown(countdownMs)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={getCurrentLocation}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {isLoading ? "Locating..." : "Get My Location"}
                    </button>

                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <Settings2 className="h-4 w-4 text-slate-600" />
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as MethodKey)}
                        className="bg-transparent text-sm text-slate-700 outline-none"
                      >
                        {methodOptions.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <span className="text-sm text-slate-600">Madhab</span>
                      <select
                        value={madhab}
                        onChange={(e) => setMadhab(e.target.value as MadhabKey)}
                        className="bg-transparent text-sm text-slate-700 outline-none"
                      >
                        {madhabOptions.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <span className="text-sm text-slate-600">High Lat</span>
                      <select
                        value={highLat}
                        onChange={(e) => setHighLat(e.target.value as HighLatKey)}
                        className="bg-transparent text-sm text-slate-700 outline-none"
                      >
                        {highLatOptions.map((h) => (
                          <option key={h.key} value={h.key}>
                            {h.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setUse24h((v) => !v)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      {use24h ? "24-hour" : "12-hour"}
                    </button>
                  </div>

                  {/* Linear progress between prayers */}
                  {nextPrev && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{nextPrev.prev.label}</span>
                        <span>{nextPrev.next.label}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-[width] duration-500"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Daily Table */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="px-6 pt-5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Today’s Timings</h2>
            </div>

            <div className="px-2 sm:px-6 py-4">
              {!location ? (
                <div className="text-center py-10">
                  <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">Click “Get My Location” to load today’s prayer times.</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="animate-pulse text-center py-10 text-slate-400">Loading times…</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {entries.map((item) => {
                    const isPast = item.time.getTime() < now.getTime();
                    const isNext = nextPrev?.next.key === item.key;
                    return (
                      <li
                        key={item.key}
                        className={[
                          "flex items-center justify-between gap-3 px-4 sm:px-0 py-3",
                          isNext ? "bg-emerald-50/60" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-full border",
                              isNext
                                ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                                : "bg-slate-50 border-slate-200 text-slate-600",
                            ].join(" ")}
                          >
                            {item.key === "Fajr" && <Moon className="h-4 w-4" />}
                            {item.key === "Sunrise" && <Sunrise className="h-4 w-4" />}
                            {item.key === "Dhuhr" && <Sun className="h-4 w-4" />}
                            {item.key === "Asr" && <Sun className="h-4 w-4" />}
                            {item.key === "Maghrib" && <Sunset className="h-4 w-4" />}
                            {item.key === "Isha" && <Moon className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.label}</div>
                            {isNext && (
                              <div className="text-xs text-emerald-700">Next prayer</div>
                            )}
                            {!isNext && isPast && (
                              <div className="text-xs text-slate-400">Passed</div>
                            )}
                          </div>
                        </div>
                        <div
                          className={[
                            "font-semibold",
                            isNext ? "text-emerald-700" : isPast ? "text-slate-400" : "text-slate-800",
                          ].join(" ")}
                        >
                          {formatTime(item.time, use24h)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-6 pb-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Note: Times are calculated using the {methodOptions.find((m) => m.key === method)?.label} method, {madhab} madhab, and {highLatOptions.find((h) => h.key === highLat)?.label} rule.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}