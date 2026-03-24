import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { HardDrive, LogOut, Plus, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { FileRecord } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMyFiles, useGetStorageInfo } from "../hooks/useQueries";
import { formatBytes } from "../lib/formatBytes";
import DropZone from "./DropZone";
import FileCard from "./FileCard";

type UploadingFile = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "error";
};

interface DashboardProps {
  userName: string;
}

export default function Dashboard({ userName }: DashboardProps) {
  const { actor } = useActor();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading: filesLoading } = useGetMyFiles();
  const { data: storageInfo } = useGetStorageInfo();

  const usedBytes = Number(storageInfo?.used ?? 0n);
  const totalBytes = Number(storageInfo?.remaining ?? 0n) + usedBytes;
  const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const uploadFiles = useCallback(
    async (fileList: File[]) => {
      if (!actor) return;

      const newUploading: UploadingFile[] = fileList.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        progress: 0,
        status: "uploading",
      }));

      setUploadingFiles((prev) => [...prev, ...newUploading]);

      await Promise.all(
        fileList.map(async (file, idx) => {
          const uploadId = newUploading[idx].id;
          try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
              (pct) => {
                setUploadingFiles((prev) =>
                  prev.map((u) =>
                    u.id === uploadId ? { ...u, progress: pct } : u,
                  ),
                );
              },
            );

            const blobId = blob.getDirectURL();
            const fileId = crypto.randomUUID();
            await actor.uploadFile(
              fileId,
              file.name,
              BigInt(file.size),
              file.type || "application/octet-stream",
              blobId,
            );

            setUploadingFiles((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, progress: 100, status: "done" } : u,
              ),
            );
            toast.success(`${file.name} uploaded`);
          } catch (err) {
            console.error(err);
            setUploadingFiles((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, status: "error" } : u,
              ),
            );
            toast.error(`Failed to upload ${file.name}`);
          }
        }),
      );

      await queryClient.invalidateQueries({ queryKey: ["myFiles"] });
      await queryClient.invalidateQueries({ queryKey: ["storageInfo"] });

      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((u) => u.status === "uploading"),
        );
      }, 3000);
    },
    [actor, queryClient],
  );

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length) uploadFiles(selectedFiles);
    e.target.value = "";
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !actor) return;
    setIsDeleting(true);
    try {
      await actor.deleteFile(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["myFiles"] });
      await queryClient.invalidateQueries({ queryKey: ["storageInfo"] });
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete file.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-base tracking-tight text-foreground">
              My Files
            </span>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Storage bar */}
          <div className="flex-1 max-w-xs hidden sm:flex items-center gap-3">
            <Progress value={usedPercent} className="h-1.5 flex-1" />
            <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
              {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {userName}
            </span>
            <Button
              data-ocid="nav.button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Mobile storage bar */}
        <div className="sm:hidden flex items-center gap-3">
          <Progress value={usedPercent} className="h-1.5 flex-1" />
          <span className="font-mono text-xs text-muted-foreground">
            {formatBytes(usedBytes)} used
          </span>
        </div>

        {/* Upload area */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-widest">
              Upload
            </h2>
            <Button
              data-ocid="upload.upload_button"
              size="sm"
              variant="outline"
              onClick={handleBrowse}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add files
            </Button>
          </div>

          <DropZone onFiles={uploadFiles} onBrowse={handleBrowse} />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </section>

        {/* Upload progress */}
        <AnimatePresence>
          {uploadingFiles.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-widest mb-3">
                Uploading
              </h2>
              <div className="space-y-2">
                {uploadingFiles.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-card border border-border rounded p-3 flex items-center gap-3"
                    data-ocid="upload.loading_state"
                  >
                    <Upload className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {u.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={u.progress} className="h-1 flex-1" />
                        <span
                          className={`font-mono text-xs ${
                            u.status === "error"
                              ? "text-destructive"
                              : u.status === "done"
                                ? "text-primary"
                                : "text-muted-foreground"
                          }`}
                        >
                          {u.status === "error"
                            ? "error"
                            : u.status === "done"
                              ? "done"
                              : `${Math.round(u.progress)}%`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Files grid */}
        <section>
          <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-widest mb-3">
            Files
            {files.length > 0 && (
              <span className="ml-2 font-mono text-xs">[{files.length}]</span>
            )}
          </h2>

          {filesLoading ? (
            <div
              data-ocid="files.loading_state"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                  key={i}
                  className="h-36 rounded bg-card border border-border animate-pulse"
                />
              ))}
            </div>
          ) : files.length === 0 ? (
            <motion.div
              data-ocid="files.empty_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-lg bg-card border border-border flex items-center justify-center mb-4">
                <HardDrive className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-foreground mb-1">
                No files yet
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Drag & drop files above or click "Add files" to get started
              </p>
            </motion.div>
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {files.map((file, idx) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.03 }}
                    data-ocid={`files.item.${idx + 1}`}
                  >
                    <FileCard
                      file={file}
                      onDelete={() => setDeleteTarget(file)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="files.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently deleted
              and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="files.cancel_button"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="files.confirm_button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
