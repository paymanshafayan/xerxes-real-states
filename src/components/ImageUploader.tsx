"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxFiles = 10,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) return;

      const remaining = maxFiles - images.length;
      const toUpload = fileArray.slice(0, remaining);
      if (toUpload.length === 0) return;

      setUploading(true);
      setUploadProgress(toUpload.map((f) => f.name));

      const formData = new FormData();
      toUpload.forEach((file) => formData.append("files", file));

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          const newUrls: string[] = data.urls || [];
          onImagesChange([...images, ...newUrls]);
        }
      } catch (error) {
        console.error("Upload failed:", error);
      }

      setUploading(false);
      setUploadProgress([]);
    },
    [images, maxFiles, onImagesChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const addUrl = () => {
    if (urlInput.trim() && images.length < maxFiles) {
      onImagesChange([...images, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Images ({images.length}/{maxFiles})
        </h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === "upload"
                ? "bg-white text-primary shadow-sm font-medium"
                : "text-gray-500"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === "url"
                ? "bg-white text-primary shadow-sm font-medium"
                : "text-gray-500"
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        /* Drag & Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${isDragging
              ? "border-primary bg-primary-light scale-[1.02]"
              : "border-gray-300 hover:border-primary hover:bg-gray-50"
            }
            ${uploading ? "pointer-events-none opacity-70" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
              <div className="space-y-1">
                {uploadProgress.map((name, i) => (
                  <p key={i} className="text-xs text-gray-400">{name}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-gray-400"}`} />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-primary">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
            </div>
          )}
        </div>
      ) : (
        /* URL Input */
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={addUrl}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
          >
            Add
          </button>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={img}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx - 1)}
                    className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs text-gray-700 hover:bg-gray-100"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx + 1)}
                    className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs text-gray-700 hover:bg-gray-100"
                  >
                    →
                  </button>
                )}
              </div>
              {/* First image badge */}
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-white text-[10px] rounded font-medium">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
