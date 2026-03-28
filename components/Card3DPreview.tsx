"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Card3DPreviewProps {
  displayName: string;
  location: string | null;
  bio: string | null;
  color: string;
  waliActive?: boolean;
}

const MAX_Y = 35;
const MAX_X = 25;
const TOUCH_SENSITIVITY = 0.8;

export default function Card3DPreview({ displayName, location, bio, color, waliActive }: Card3DPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [highlightPos, setHighlightPos] = useState({ x: 50, y: 50 });
  const [hasGyro, setHasGyro] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number } | null>(null);

  // Gyroscope support for mobile
  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;

    let active = false;

    function handleOrientation(e: DeviceOrientationEvent) {
      if (!active || e.gamma === null || e.beta === null) return;
      // gamma: left-right tilt (-90..90), beta: front-back tilt (-180..180)
      const y = Math.max(-MAX_Y, Math.min(MAX_Y, e.gamma * 0.7));
      const x = Math.max(-MAX_X, Math.min(MAX_X, (e.beta - 45) * 0.5));
      setRotation({ x, y });
      // Map to highlight
      const hx = ((y / MAX_Y) * 0.5 + 0.5) * 100;
      const hy = ((1 - (x / MAX_X) * 0.5 - 0.5)) * 100;
      setHighlightPos({ x: hx, y: hy });
    }

    // Try requesting permission (iOS 13+)
    const doe = DeviceOrientationEvent as any;
    if (typeof doe.requestPermission === "function") {
      doe.requestPermission().then((state: string) => {
        if (state === "granted") {
          active = true;
          setHasGyro(true);
          window.addEventListener("deviceorientation", handleOrientation);
        }
      }).catch(() => {});
    } else {
      // Android / older iOS — just listen
      const testHandler = (e: DeviceOrientationEvent) => {
        if (e.gamma !== null) {
          active = true;
          setHasGyro(true);
        }
        window.removeEventListener("deviceorientation", testHandler);
        if (active) window.addEventListener("deviceorientation", handleOrientation);
      };
      window.addEventListener("deviceorientation", testHandler);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Mouse tracking — relative to viewport for wider range
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Track relative to a padded area around the card (2x card size centered)
    const padX = rect.width * 0.5;
    const padY = rect.height * 0.5;
    const normX = (e.clientX - (rect.left - padX)) / (rect.width + padX * 2);
    const normY = (e.clientY - (rect.top - padY)) / (rect.height + padY * 2);
    const clampedX = Math.max(0, Math.min(1, normX));
    const clampedY = Math.max(0, Math.min(1, normY));

    const rotateY = (clampedX - 0.5) * 2 * MAX_Y;
    const rotateX = (0.5 - clampedY) * 2 * MAX_X;
    setRotation({ x: rotateX, y: rotateY });
    setHighlightPos({ x: clampedX * 100, y: clampedY * 100 });
  }, []);

  // Touch drag (fallback when no gyro)
  function handleTouchStart(e: React.TouchEvent) {
    if (hasGyro) return;
    const touch = e.touches[0];
    if (!touch) return;
    setIsHovering(true);
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      rotX: rotation.x,
      rotY: rotation.y,
    };
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (hasGyro) return;
    const touch = e.touches[0];
    const start = touchStartRef.current;
    if (!touch || !start) return;

    const dx = (touch.clientX - start.x) * TOUCH_SENSITIVITY;
    const dy = (touch.clientY - start.y) * TOUCH_SENSITIVITY;

    const rotateY = Math.max(-MAX_Y, Math.min(MAX_Y, start.rotY + dx * 0.3));
    const rotateX = Math.max(-MAX_X, Math.min(MAX_X, start.rotX - dy * 0.3));
    setRotation({ x: rotateX, y: rotateY });

    const hx = ((rotateY / MAX_Y) * 0.5 + 0.5) * 100;
    const hy = ((1 - (rotateX / MAX_X) * 0.5 - 0.5)) * 100;
    setHighlightPos({ x: hx, y: hy });
  }

  function handleTouchEnd() {
    if (hasGyro) return;
    setIsHovering(false);
    touchStartRef.current = null;
    setRotation({ x: 0, y: 0 });
    setHighlightPos({ x: 50, y: 50 });
  }

  function handleMouseEnter() {
    setIsHovering(true);
  }

  function handleMouseLeave() {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
    setHighlightPos({ x: 50, y: 50 });
  }

  const bioTruncated = bio && bio.length > 120 ? bio.slice(0, 117) + "..." : bio;

  return (
    <div
      ref={containerRef}
      className="w-full max-w-md mx-auto"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden select-none will-change-transform"
        style={{
          aspectRatio: "1.586 / 1",
          background: `linear-gradient(145deg, ${color} 0%, ${color}dd 50%, ${color}bb 100%)`,
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovering ? 1.05 : 1})`,
          transition: isHovering
            ? "transform 0.1s ease, box-shadow 0.2s ease"
            : "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.6s ease",
          transformStyle: "preserve-3d",
          boxShadow: isHovering
            ? "0 25px 50px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.12)"
            : "0 12px 32px rgba(47,52,46,0.12)",
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse 60% 60% at ${highlightPos.x}% ${highlightPos.y}%, rgba(255,255,255,${isHovering ? 0.2 : 0}) 0%, transparent 70%)`,
            transition: isHovering
              ? "background 0.1s ease"
              : "background 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* Card content */}
        <div className="relative z-0 h-full flex flex-col justify-between p-7 sm:p-10 text-white">
          {/* Top row */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-serif text-2xl font-bold tracking-tight">{displayName}</h4>
              {location && (
                <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {location}
                </p>
              )}
            </div>
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <span className="material-symbols-outlined">qr_code_2</span>
            </div>
          </div>

          {/* Bottom content */}
          <div className="space-y-4">
            {bioTruncated && (
              <p className="text-sm italic font-serif leading-relaxed opacity-90 line-clamp-2">
                &ldquo;{bioTruncated}&rdquo;
              </p>
            )}

            <div className="flex gap-4 pt-4 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-tighter opacity-60">Verified By</span>
                <span className="text-xs font-semibold">{waliActive ? "Guardian Wali" : "Self"}</span>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-4">
                <span className="text-[10px] uppercase tracking-tighter opacity-60">Status</span>
                <span className="text-xs font-semibold">Serious Intent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
