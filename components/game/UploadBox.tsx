"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Upload } from "lucide-react";

interface UploadBoxProps {
  onFileSelected: (file: File | null) => void;
}

export default function UploadBox({ onFileSelected }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      setError(null);
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be smaller than 10MB.");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const clear = () => {
    setPreview(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative overflow-hidden rounded-3xl aspect-square glass"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected puzzle image" className="h-full w-full object-cover" />
            <button
              onClick={clear}
              className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white active:scale-95 transition-transform"
              aria-label="Remove image"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-3 right-3 h-11 px-4 rounded-2xl bg-black/60 backdrop-blur flex items-center gap-2 text-sm font-medium text-white active:scale-95 transition-transform"
            >
              <Upload className="h-4 w-4" /> Change
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            type="button"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`w-full aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors ${
              dragging ? "border-primary bg-primary/10" : "border-white/15 bg-white/[0.03]"
            }`}
          >
            <div className="h-16 w-16 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow-sm">
              <ImagePlus className="h-8 w-8 text-white" />
            </div>
            <div className="text-center px-6">
              <p className="font-semibold text-white">Tap to upload an image</p>
              <p className="text-sm text-white/50 mt-1">JPG, PNG or WebP · up to 10MB</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-sm text-red-400 text-center">{error}</p>}
    </div>
  );
}
