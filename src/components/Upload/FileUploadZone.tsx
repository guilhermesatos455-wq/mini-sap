import React from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadZoneProps {
  label: string;
  files: File[] | File | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (files: FileList | null) => void;
  multiple?: boolean;
  darkMode: boolean;
  id: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  label,
  files,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  multiple = false,
  darkMode,
  id
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getFileDisplay = () => {
    if (!files) return null;
    if (Array.isArray(files)) {
      return files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : null;
    }
    return files.name;
  };

  const fileDisplay = getFileDisplay();

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
        {label}
      </label>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging 
            ? 'border-[#8DC63F] bg-[#8DC63F]/10' 
            : darkMode 
              ? 'border-slate-700 hover:border-[#8DC63F]/50 bg-slate-900/50' 
              : 'border-gray-300 hover:border-[#8DC63F]'
        }`}
      >
        <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-[#8DC63F]' : darkMode ? 'text-slate-500' : 'text-gray-400'}`} />
        <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Arraste {multiple ? 'as NFs' : 'o CKM3'} aqui ou <label htmlFor={id} className={`cursor-pointer font-bold hover:underline text-[#8DC63F]`}>Selecionar Arquivo{multiple ? 's' : ''}</label>
        </p>
        <input 
          id={id} 
          type="file" 
          multiple={multiple} 
          accept=".xlsx,.xls" 
          className="hidden" 
          onChange={(e) => onFileSelect(e.target.files)} 
          ref={fileInputRef} 
        />
        {fileDisplay && (
          <div className={`mt-3 p-2 rounded-lg text-xs font-medium ${darkMode ? 'bg-[#8DC63F]/10 text-[#8DC63F]' : 'bg-green-50 text-green-700'}`}>
            {fileDisplay}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
