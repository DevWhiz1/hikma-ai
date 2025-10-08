import React, { useEffect, useMemo, useRef, useState } from "react";
import { Compass, MapPin, Navigation, RefreshCw } from "lucide-react";

type OrientationMode = "arrow" | "dial";

interface Location {
  latitude: number;
  longitude: number;
  city?: string;
}

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;
const normalizeDeg = (d: number) => ((d % 360) + 360) % 360;

function calculateQiblaDirection(lat: number, lng: number): number {
  const latRad = deg2rad(lat);
  const lngRad = deg2rad(lng);
  const kaabaLatRad = deg2rad(KAABA_LAT);
  const kaabaLngRad = deg2rad(KAABA_LNG);

  const dLng = kaabaLngRad - lngRad;
  const y = Math.sin(dLng) + 0 * Math.cos(kaabaLatRad); // keep explicit structure
  const y2 = Math.sin(dLng) * Math.cos(kaabaLatRad);
  const x =
    Math.cos(latRad) * Math.sin(kaabaLatRad) -
    Math.sin(latRad) * Math.cos(kaabaLatRad) * Math.cos(dLng);

  let bearing = Math.atan2(y2, x);
  bearing = rad2deg(bearing);
  return normalizeDeg(bearing);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function QiblaPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [heading, setHeading] = useState<number | null>(null);
  const [isCompassActive, setIsCompassActive] = useState(false);
  const [orientationSupported, setOrientationSupported] = useState<boolean>(true);
  const [mode, setMode] = useState<OrientationMode>("arrow");

  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);
  const smoothRef = useRef<number | null>(null);

  // Smooth heading updates to reduce jitter
  const smoothHeading = (value: number) => {
    const prev = smoothRef.current;
    if (prev == null) {
      smoothRef.current = value;
    } else {
      const alpha = 0.15; // smoothing factor
      // handle wrap-around near 0/360
      let delta = value - prev;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      smoothRef.current = normalizeDeg(prev + alpha * delta);
    }
    setHeading(smoothRef.current!);
  };

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
      const newLoc: Location = { latitude, longitude };

      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await res.json();
        newLoc.city = data.city || data.locality || data.principalSubdivision || "Unknown Location";
      } catch {
        newLoc.city = "Unknown Location";
      }

      const q = calculateQiblaDirection(latitude, longitude);
      setLocation(newLoc);
      setQiblaDirection(q);
      setDistanceKm(Math.round(haversineKm(latitude, longitude, KAABA_LAT, KAABA_LNG)));
      setMessage({ type: "success", text: `Location found. Qibla for ${newLoc.city}.` });
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Please enable location access to find Qibla direction." });
    } finally {
      setIsLoading(false);
    }
  };

  const enableCompass = async () => {
    setMessage(null);
    try {
      if (typeof window === "undefined" || typeof window.DeviceOrientationEvent === "undefined") {
        setOrientationSupported(false);
        setMessage({ type: "error", text: "Device orientation not supported on this device/browser." });
        return;
      }

      const maybeRequest = (DeviceOrientationEvent as any)?.requestPermission;
      if (typeof maybeRequest === "function") {
        const state = await maybeRequest();
        if (state !== "granted") {
          setMessage({ type: "error", text: "Compass permission denied. Please allow motion/orientation access." });
          return;
        }
      }

      const handler = (event: DeviceOrientationEvent) => {
        let hdg: number | null = null;

        // iOS Safari provides webkitCompassHeading (0 = North, clockwise)
        const webkitHeading = (event as any).webkitCompassHeading;
        if (typeof webkitHeading === "number") {
          hdg = normalizeDeg(webkitHeading);
        } else if (event.alpha != null) {
          // Many browsers: alpha is 0 at North, increasing clockwise but device-frame dependent
          // A common approximation:
          hdg = normalizeDeg(360 - event.alpha);
        }

        if (hdg != null) smoothHeading(hdg);
      };

      window.addEventListener("deviceorientation", handler, true);
      setIsCompassActive(true);

      // Cleanup on unmount
      return () => window.removeEventListener("deviceorientation", handler, true);
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Could not enable compass." });
    }
  };

  useEffect(() => {
    // Detect support on mount
    if (typeof window !== "undefined" && typeof window.DeviceOrientationEvent === "undefined") {
      setOrientationSupported(false);
    }
  }, []);

  // UI computed values
  const dialRotation = useMemo(() => {
    if (mode === "dial" && heading != null) return -heading;
    return 0;
  }, [mode, heading]);

  const arrowRotation = useMemo(() => {
    if (qiblaDirection == null) return 0;
    if (heading == null) return qiblaDirection;
    if (mode === "dial") {
      // Arrow absolute to North, dial rotates with device
      return qiblaDirection;
    }
    // Arrow rotates relative to your current heading
    return normalizeDeg(qiblaDirection - heading);
  }, [mode, qiblaDirection, heading]);

  const turnGuidance = useMemo(() => {
    if (qiblaDirection == null || heading == null) return null;
    const delta = normalizeDeg(qiblaDirection - heading);
    if (delta === 0) return { dir: "Aligned", degrees: 0, side: "none" as const };
    if (delta <= 180) return { dir: "Turn Right", degrees: Math.round(delta), side: "right" as const };
    return { dir: "Turn Left", degrees: Math.round(360 - delta), side: "left" as const };
  }, [qiblaDirection, heading]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-1">Qibla Direction Finder</h1>
          <p className="text-slate-500">Find the precise direction to the Kaaba for your prayers</p>
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Compass Card */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 px-6 pt-5">
              <Compass className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Qibla Compass</h2>
            </div>

            <div className="px-6 py-5 flex flex-col items-center gap-6">
              {/* Compass UI */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                {/* Dial */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-slate-50 border-4 border-slate-200 shadow-md"
                  style={{
                    transform: `rotate(${dialRotation}deg)`,
                    transition: "transform 150ms ease-out",
                  }}
                >
                  {/* Tick marks */}
                  <div className="absolute inset-0">
                    {Array.from({ length: 36 }).map((_, i) => {
                      const major = i % 3 === 0;
                      return (
                        <div
                          key={i}
                          className="absolute inset-0"
                          style={{ transform: `rotate(${i * 10}deg)` }}
                        >
                          <div
                            className={[
                              "absolute left-1/2 -translate-x-1/2",
                              major ? "top-1 h-4 w-[3px] bg-slate-400/80 rounded-full" : "top-1 h-3 w-[2px] bg-slate-300 rounded-full",
                            ].join(" ")}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Cardinal labels (rotate with dial) */}
                  <div className="absolute inset-3 pointer-events-none">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-rose-600">N</div>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600">E</div>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-600">S</div>
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600">W</div>
                  </div>
                </div>

                {/* Qibla Arrow */}
                {qiblaDirection != null && (
                  <div
                    className="absolute left-1/2 bottom-1/2 -translate-x-1/2 origin-bottom"
                    style={{
                      transform: `rotate(${arrowRotation}deg)`,
                      transition: "transform 120ms ease-out",
                    }}
                  >
                    <div className="relative w-[7px] h-28 sm:h-32 bg-emerald-500 rounded-full shadow-md">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-emerald-500" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                )}

                {/* Center hub */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 shadow ring-4 ring-emerald-100" />
              </div>

              {/* Info under compass */}
              <div className="text-center">
                {qiblaDirection != null ? (
                  <div>
                    <div className="text-2xl font-semibold text-emerald-600">
                      {Math.round(qiblaDirection)}°
                    </div>
                    <div className="text-xs text-slate-500">Qibla bearing from North</div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Get your location to calculate Qibla</div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3">
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
                  {isLoading ? "Getting Location..." : "Get My Location"}
                </button>

                <button
                  onClick={enableCompass}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Navigation className="h-4 w-4 text-slate-600" />
                  {isCompassActive ? "Compass Enabled" : "Enable Compass"}
                </button>

                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setMode("arrow")}
                    className={[
                      "px-3 py-1.5 text-sm rounded-md",
                      mode === "arrow" ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    Rotate Arrow
                  </button>
                  <button
                    onClick={() => setMode("dial")}
                    className={[
                      "px-3 py-1.5 text-sm rounded-md",
                      mode === "dial" ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    Rotate Dial
                  </button>
                </div>
              </div>

              {/* Turn guidance */}
              {turnGuidance && (
                <div
                  className={[
                    "rounded-lg px-3 py-2 text-sm",
                    turnGuidance.dir === "Aligned"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200",
                  ].join(" ")}
                >
                  {turnGuidance.dir}
                  {turnGuidance.degrees > 0 && ` ${turnGuidance.degrees}°`}
                </div>
              )}

              {!orientationSupported && (
                <div className="text-xs text-rose-600">
                  Your browser doesn’t support device orientation. You can still use the numeric bearing.
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 px-6 pt-5">
              <Navigation className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-900">Location & Information</h2>
            </div>

            <div className="px-6 py-5 space-y-6">
              {location ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Your Location</h3>
                    <p className="text-slate-700">{location.city}</p>
                    <p className="text-xs text-slate-500">
                      {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                    </p>
                  </div>

                  {qiblaDirection != null && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">Qibla Direction</h3>
                      <p className="text-2xl font-semibold text-emerald-600 mb-1">
                        {Math.round(qiblaDirection)}°
                      </p>
                      <p className="text-xs text-slate-500">Measured clockwise from North</p>
                    </div>
                  )}

                  {distanceKm != null && (
                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-900 mb-1">Distance to Kaaba</h4>
                      <p className="text-sm text-slate-600">
                        Approximately {distanceKm.toLocaleString()} km away
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">Click “Get My Location” to calculate your Qibla direction.</p>
                </div>
              )}

              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                <h4 className="text-sm font-medium text-emerald-900 mb-1">Prayer Reminder</h4>
                <p className="text-sm text-emerald-800">
                  “And wherever you are, turn your face toward the Sacred Mosque.” — Quran 2:150
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-900">Tips</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Hold the phone flat (parallel to the ground)</li>
                  <li>• Stay away from magnetic interference (metal, speakers)</li>
                  <li>• If readings feel off, move the phone in a figure-8 to calibrate</li>
                  <li>• Use “Rotate Arrow” or “Rotate Dial” mode as you prefer</li>
                </ul>
              </div>

              <div className="text-xs text-slate-400">
                Note: On iOS Safari, you must allow “Motion & Orientation Access” in Settings for live compass.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}