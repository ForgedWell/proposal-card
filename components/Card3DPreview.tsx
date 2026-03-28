"use client";

import { useRef, useState, useCallback } from "react";

interface Card3DPreviewProps {
  displayName: string;
  location: string | null;
  bio: string | null;
  color: string;
  waliActive?: boolean;
}

export default function Card3DPreview({ displayName, location, bio, color, waliActive }: Card3DPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [highlightPos, setHighlightPos] = useState({ x: 50, y: 50 });

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 24;  // ±12 degrees
    const rotateX = (0.5 - y) * 16;  // ±8 degrees
    setRotation({ x: rotateX, y: rotateY });
    setHighlightPos({ x: x * 100, y: y * 100 });
  }, []);

  function handleMouseMove(e: React.MouseEvent) {
    handleMove(e.clientX, e.clientY);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (touch) handleMove(touch.clientX, touch.clientY);
  }

  function handleEnter() {
    setIsHovering(true);
  }

  function handleLeave() {
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
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden select-none"
        style={{
          aspectRatio: "1.586 / 1",
          background: `linear-gradient(145deg, ${color} 0%, ${color}dd 50%, ${color}bb 100%)`,
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isHovering ? "transform 0.1s ease" : "transform 0.5s ease",
          transformStyle: "preserve-3d",
          boxShadow: isHovering
            ? "0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)"
            : "0 12px 32px rgba(47,52,46,0.12)",
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${highlightPos.x}% ${highlightPos.y}%, rgba(255,255,255,${isHovering ? 0.15 : 0}) 0%, transparent 60%)`,
            transition: isHovering ? "background 0.1s ease" : "background 0.5s ease",
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
