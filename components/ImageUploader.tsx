import React, { useRef, useState } from 'react';
import { Upload, Camera, Images } from 'lucide-react';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  isProcessing: boolean;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelected, isProcessing, className = "" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onImagesSelected(Array.from(files));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  return (
    <div 
      className={`relative group border-2 border-dashed rounded-xl p-6 transition-all duration-200 ease-in-out text-center cursor-pointer
        ${dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}
        ${isProcessing ? "opacity-50 pointer-events-none" : ""}
        ${className}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 bg-white rounded-full shadow-sm ring-1 ring-slate-100">
          <Images className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">上傳圖片</h3>
          <p className="text-xs text-slate-500 mt-1">
            可一次選取多張圖片（請款單＋發票）
          </p>
        </div>
        <div className="flex gap-2 mt-1">
           <button 
             type="button"
             onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click(); 
             }}
             className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
           >
             <Camera className="w-4 h-4" /> 選擇多張照片
           </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;