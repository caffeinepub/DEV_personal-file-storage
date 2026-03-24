import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { FileRecord } from "../backend";
import { ExternalBlob } from "../backend";
import { formatBytes } from "../lib/formatBytes";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-tar" ||
    mimeType === "application/gzip" ||
    mimeType === "application/x-7z-compressed"
  )
    return FileArchive;
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("xml")
  )
    return FileCode;
  return File;
}

function getFileColor(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "text-chart-2";
  if (mimeType.startsWith("video/")) return "text-chart-4";
  if (mimeType.startsWith("audio/")) return "text-chart-1";
  if (mimeType === "application/pdf") return "text-chart-5";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar")
  )
    return "text-chart-3";
  return "text-muted-foreground";
}

function formatUploadDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / 1_000_000n);
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface FileCardProps {
  file: FileRecord;
  onDelete: () => void;
}

export default function FileCard({ file, onDelete }: FileCardProps) {
  const Icon = getFileIcon(file.mimeType);
  const iconColor = getFileColor(file.mimeType);

  const handleDownload = async () => {
    try {
      const blob = ExternalBlob.fromURL(file.blobId);
      const url = blob.getDirectURL();
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error("Failed to download file.");
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded p-4 flex flex-col gap-3 hover:border-primary/40 hover:shadow-glow-sm transition-all group"
      >
        {/* Icon + actions row */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded bg-background border border-border flex items-center justify-center">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-ocid="files.secondary_button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={handleDownload}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Download</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-ocid="files.delete_button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* File info */}
        <div className="min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="font-medium text-sm text-foreground truncate cursor-default">
                {file.name}
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{file.name}</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-muted-foreground">
              {formatBytes(Number(file.size))}
            </span>
            <span className="text-border">·</span>
            <span className="font-mono text-xs text-muted-foreground">
              {formatUploadDate(file.uploadedAt)}
            </span>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
