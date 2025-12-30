import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { useState, useCallback } from "react";

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFilesSelected: (files: File[]) => void;
  label?: string;
  description?: string;
  className?: string;
}

export function FileUploadZone({
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = false,
  maxSize = 10,
  onFilesSelected,
  label = "Upload files",
  description = "Drag and drop your files here, or click to browse",
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const acceptedTypes = accept.split(",").map((t) => t.trim());

    Array.from(files).forEach((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const isValidType = acceptedTypes.some(
        (type) => type === extension || file.type.startsWith(type.replace(".*", ""))
      );
      const isValidSize = file.size <= maxSize * 1024 * 1024;

      if (!isValidType) {
        setError(`Invalid file type: ${file.name}`);
      } else if (!isValidSize) {
        setError(`File too large: ${file.name} (max ${maxSize}MB)`);
      } else {
        validFiles.push(file);
      }
    });

    return validFiles;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        const newFiles = multiple ? [...uploadedFiles, ...validFiles] : validFiles;
        setUploadedFiles(newFiles);
        onFilesSelected(newFiles);
      }
    },
    [multiple, uploadedFiles, onFilesSelected, maxSize, accept]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        const newFiles = multiple ? [...uploadedFiles, ...validFiles] : validFiles;
        setUploadedFiles(newFiles);
        onFilesSelected(newFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/50"
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
            isDragging ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}>
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Accepted: {accept} • Max size: {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <FileText className="w-5 h-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-score-high" />
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
