import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ value, onChange, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if storage is initialized
    if (!storage) {
      alert("Firebase Storage is not configured properly.");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      
      const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(p);
        },
        (error) => {
          console.error("Upload error:", error);
          alert("Error uploading image. Please check Firebase Storage rules.");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setUploading(false);
        }
      );
    } catch (err) {
      console.error(err);
      alert("Something went wrong uploading the image.");
      setUploading(false);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {value ? (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 group">
          <img src={value} alt="Uploaded logo" className="w-full h-full object-cover" />
          <button 
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove Image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col flex-shrink-0 items-center justify-center cursor-pointer text-slate-500 relative"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-[10px] font-medium">{progress}%</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <UploadCloud className="w-5 h-5" />
              <span className="text-[10px] font-medium">Upload Logo</span>
            </div>
          )}
        </div>
      )}
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden" 
      />
      {!value && !uploading && (
        <div className="text-xs text-slate-500">
          <p>PNG, JPG or WEBP. Max 2MB.</p>
          <p>This logo will be displayed on the sidebar.</p>
        </div>
      )}
    </div>
  );
}
