import { cn } from "@/lib/utils";
import { CloudUpload, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  onBrowse: () => void;
}

export default function DropZone({ onFiles, onBrowse }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length) onFiles(dropped);
    },
    [onFiles],
  );

  return (
    <motion.div
      data-ocid="upload.dropzone"
      animate={{
        borderColor: isDragging
          ? "oklch(0.78 0.15 195)"
          : "oklch(0.26 0.01 260)",
        backgroundColor: isDragging
          ? "oklch(0.78 0.15 195 / 0.05)"
          : "oklch(0.17 0.007 260)",
      }}
      transition={{ duration: 0.15 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onBrowse}
      className={cn(
        "relative border-2 border-dashed rounded cursor-pointer",
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        "transition-shadow",
        isDragging && "shadow-glow",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-lg border flex items-center justify-center mb-4 transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-border bg-card",
        )}
      >
        {isDragging ? (
          <CloudUpload className="h-6 w-6 text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <p className="font-display font-semibold text-foreground mb-1">
        {isDragging ? "Drop to upload" : "Drag files here"}
      </p>
      <p className="text-sm text-muted-foreground">
        or{" "}
        <span className="text-primary underline-offset-2 hover:underline">
          browse your computer
        </span>
      </p>
      <p className="mt-3 font-mono text-xs text-muted-foreground/60">
        All file types supported · No size limit
      </p>
    </motion.div>
  );
}
