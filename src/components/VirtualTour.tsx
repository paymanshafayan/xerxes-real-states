"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, X, RotateCcw } from "lucide-react";

interface VirtualTourProps {
  tourUrl?: string;
  images360?: string[];
  propertyTitle: string;
}

/**
 * Real 360° Image Viewer with mouse/touch drag-to-rotate
 */
function PanoramaViewer({ src, onClose }: { src: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);

  const drawPanorama = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Calculate source rectangle based on rotation
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    // Map rotation to source position
    const srcX = ((rotationRef.current.x % 360 + 360) % 360 / 360) * imgW;
    const srcY = Math.max(0, Math.min(imgH - h, (rotationRef.current.y / 90) * (imgH / 2) + imgH / 4));

    // Viewport width in source pixels
    const viewW = Math.min(imgW * 0.5, imgW);

    ctx.clearRect(0, 0, w, h);

    // Draw the visible portion of the panorama
    if (srcX + viewW <= imgW) {
      ctx.drawImage(img, srcX, srcY, viewW, imgH * 0.5, 0, 0, w, h);
    } else {
      // Wrap around
      const firstPartW = imgW - srcX;
      const firstPartRatio = firstPartW / viewW;
      ctx.drawImage(img, srcX, srcY, firstPartW, imgH * 0.5, 0, 0, w * firstPartRatio, h);
      ctx.drawImage(img, 0, srcY, viewW - firstPartW, imgH * 0.5, w * firstPartRatio, 0, w * (1 - firstPartRatio), h);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawPanorama();
    };

    // Load image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setLoaded(true);
      resize();
    };
    img.src = src;

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [src, drawPanorama]);

  useEffect(() => {
    if (!loaded) return;
    // Auto-rotate slowly
    let autoRotate = true;
    const animate = () => {
      if (autoRotate && !draggingRef.current) {
        rotationRef.current.x += 0.15;
      }
      drawPanorama();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    // Stop auto-rotate after user interacts
    const stopAuto = () => { autoRotate = false; };
    window.addEventListener("mousedown", stopAuto, { once: true });
    window.addEventListener("touchstart", stopAuto, { once: true });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("mousedown", stopAuto);
      window.removeEventListener("touchstart", stopAuto);
    };
  }, [loaded, drawPanorama]);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    rotationRef.current.x -= dx * 0.3;
    rotationRef.current.y = Math.max(-45, Math.min(45, rotationRef.current.y + dy * 0.2));
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    drawPanorama();
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">360° View</span>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {/* Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none">
        <RotateCcw className="w-4 h-4" />
        Drag to look around
      </div>
    </div>
  );
}

export default function VirtualTour({
  tourUrl,
  images360,
  propertyTitle,
}: VirtualTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"embedded" | "panorama">("panorama");

  if (!tourUrl && (!images360 || images360.length === 0)) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
      >
        <Play className="w-4 h-4" />
        360° Virtual Tour
      </button>

      {isOpen && (
        <>
          {tourUrl && viewMode === "embedded" ? (
            <div className="fixed inset-0 z-50 bg-black">
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 flex items-center justify-between">
                <span className="text-white font-semibold">{propertyTitle}</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <iframe src={tourUrl} className="w-full h-full" allowFullScreen />
            </div>
          ) : images360 && images360.length > 0 ? (
            <PanoramaViewer
              src={images360[0]}
              onClose={() => setIsOpen(false)}
            />
          ) : tourUrl ? (
            <div className="fixed inset-0 z-50 bg-black">
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 flex items-center justify-between">
                <span className="text-white font-semibold">{propertyTitle}</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <iframe src={tourUrl} className="w-full h-full" allowFullScreen />
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

export const demo360Tours: Record<string, string> = {
  "luxury-sea-view-villa-kyrenia": "https://my.matterport.com/show/?m=SxQL3iGyoDo",
  "beachfront-villa-iskele": "https://my.matterport.com/show/?m=SxQL3iGyoDo",
};

// 360 panorama images for properties
export const demo360Images: Record<string, string[]> = {
  "luxury-sea-view-villa-kyrenia": [
    "https://images.pexels.com/photos/19075379/pexels-photo-19075379.jpeg?auto=compress&cs=tinysrgb&w=2400",
  ],
  "penthouse-iskele-long-beach": [
    "https://images.pexels.com/photos/20975729/pexels-photo-20975729.jpeg?auto=compress&cs=tinysrgb&w=2400",
  ],
};
