"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Link2, Star, Play } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";
import { youtubeEmbedUrl } from "../../lib/catalogue";

interface MediaUploadProps {
  kind: "image" | "video";
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  maxSizeMb?: number;
}

const uploadFile = (file: File, folder: string, onProgress: (p: number) => void) =>
  new Promise<string>((resolve, reject) => {
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const task = uploadBytesResumable(ref(storage, `${folder}/${Date.now()}_${safeName}`), file);
    task.on(
      "state_changed",
      (s) => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });

export default function MediaUpload({ kind, value, onChange, folder, maxSizeMb }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const limitMb = maxSizeMb ?? (kind === "image" ? 5 : 50);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const tooBig = files.find((f) => f.size > limitMb * 1024 * 1024);
    if (tooBig) {
      alert(`"${tooBig.name}" is larger than ${limitMb}MB.`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], folder, (p) =>
          setProgress(Math.round(((i + p / 100) / files.length) * 100))
        );
        uploaded.push(url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Please check Firebase Storage configuration and rules.");
    } finally {
      if (uploaded.length) onChange([...value, ...uploaded]);
      setUploading(false);
      setProgress(0);
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      alert("Please enter a valid link starting with http:// or https://");
      return;
    }
    onChange([...value, url]);
    setUrlInput("");
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const makeCover = (index: number) => onChange([value[index], ...value.filter((_, i) => i !== index)]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {value.map((url, i) => {
          const yt = kind === "video" ? youtubeEmbedUrl(url) : null;
          return (
            <div
              key={`${url}-${i}`}
              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group"
            >
              {kind === "image" ? (
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              ) : yt ? (
                <img
                  src={`https://img.youtube.com/vi/${yt.split("/").pop()}/hqdefault.jpg`}
                  alt="YouTube video"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
              )}
              {kind === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow">
                    <Play className="w-4 h-4 text-slate-900 ml-0.5" />
                  </span>
                </div>
              )}
              {kind === "image" && i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {kind === "image" && i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="p-1.5 rounded-full bg-white/95 text-amber-600 shadow hover:bg-white"
                    title="Set as cover photo"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1.5 rounded-full bg-white/95 text-rose-600 shadow hover:bg-white"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-colors flex flex-col items-center justify-center gap-1 text-slate-500 disabled:cursor-wait"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-[11px] font-semibold">{progress}%</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              <span className="text-[11px] font-semibold">Upload {kind === "image" ? "photos" : "video"}</span>
              <span className="text-[10px] text-slate-400">Max {limitMb}MB each</span>
            </>
          )}
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder={kind === "image" ? "…or paste an image link" : "…or paste a YouTube / video link"}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
        >
          Add
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={kind === "image" ? "image/*" : "video/*"}
        multiple={kind === "image"}
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
}
