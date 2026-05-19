import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserContext } from "@/context/AuthContext";
import {
  useCreateReel,
  useGetRecentReels,
} from "@/lib/react-query/queriesAndMutations";

const ReelsBar = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: reelsData } = useGetRecentReels();
  const { mutate: createReel, isPending: isUploading } = useCreateReel();

  const reels = reelsData?.documents || [];

  const handlePickVideo = () => {
    fileInputRef.current?.click();
  };

  const handleVideoChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select a video file.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setSelectedFile(selectedFile);
    e.target.value = "";
  };

  const resetUploadForm = () => {
    setCaption("");
    setSelectedFile(null);
  };

  // Helper: Extract thumbnail from video file as a Blob
  const extractThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.src = URL.createObjectURL(file);
      video.crossOrigin = "anonymous";
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Seek to 0.5s or 0 if shorter
        const seekTime = Math.min(
          0.5,
          video.duration ? video.duration - 0.01 : 0,
        );
        video.currentTime = seekTime;
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context error"));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create thumbnail blob"));
          },
          "image/jpeg",
          0.85,
        );
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        reject(new Error("Failed to load video for thumbnail extraction"));
      };
    });
  };

  // Helper: Upload a Blob as a File to Appwrite
  const uploadThumbnail = async (
    blob: Blob,
  ): Promise<{ fileId: string; url: string }> => {
    // Use the same uploadFile as for images
    // @ts-ignore: uploadFile expects File, but Blob is sufficient for Appwrite
    const thumbFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
    // Dynamically import to avoid circular deps
    const { uploadFile, getFilePreview } = await import("@/lib/appwrite/api");
    const uploaded = await uploadFile(thumbFile);
    if (!uploaded || !uploaded.$id) throw new Error("Thumbnail upload failed");
    const url = getFilePreview(uploaded.$id);
    return { fileId: uploaded.$id, url: url?.toString() || "" };
  };

  const handleUploadVideo = async () => {
    if (!selectedFile) {
      toast({
        title: "Select a video",
        description: "Choose a video file before uploading.",
      });
      return;
    }

    try {
      // 1. Extract thumbnail
      const thumbBlob = await extractThumbnail(selectedFile);
      // 2. Upload thumbnail
      const { url: thumbnailUrl, fileId: thumbnailId } =
        await uploadThumbnail(thumbBlob);

      // 3. Create reel with thumbnailUrl
      createReel(
        {
          userId: user.id,
          caption: caption.trim(),
          file: selectedFile,
          thumbnailUrl,
          thumbnailId,
        },
        {
          onSuccess: () => {
            toast({
              title: "Reel uploaded",
              description: "Your reel is now in the top bar.",
            });
            resetUploadForm();
            setIsUploadModalOpen(false);
          },
          onError: (error: any) => {
            toast({
              title: "Upload failed",
              description:
                error?.message || "Unable to upload reel. Please try again.",
              variant: "destructive",
            });
          },
        },
      );
    } catch (err: any) {
      toast({
        title: "Thumbnail extraction failed",
        description: err?.message || "Could not extract thumbnail from video.",
        variant: "destructive",
      });
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsUploadModalOpen(open);
    if (!open && !isUploading) {
      resetUploadForm();
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full border-b border-dark-4 bg-dark-1/95 backdrop-blur">
        <div className="flex items-start gap-3 px-4 py-4 overflow-x-hidden">
          <div className="shrink-0 w-[72px] flex flex-col items-center gap-1">
            <div className="relative h-16 w-16 flex items-center justify-center">
              <span
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500 pointer-events-none animate-spin-slow"
                aria-hidden="true"
              ></span>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                disabled={isUploading}
                className="h-14 w-14 rounded-full bg-dark-1 flex-center text-2xl text-light-2 hover:bg-dark-3 transition disabled:opacity-60 z-10"
                title="Upload reel"
              >
                {isUploading ? "..." : "+"}
              </button>
            </div>
            <p className="text-[11px] text-light-3 max-w-[64px] truncate text-center">
              Add reel
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleVideoChosen}
          />

          {reels.length === 0 ? (
            <p className="small-regular text-light-4">
              Upload a short video to start your reels bar.
            </p>
          ) : (
            reels.map((reel) => (
              <Link
                to="/reels"
                key={reel.$id}
                className="group shrink-0 w-[72px] flex flex-col items-center gap-1"
                title="Open reels"
              >
                <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-primary-500 to-orange-400">
                  <div className="h-full w-full rounded-full overflow-hidden bg-dark-4">
                    {/* Play the video in the circle */}
                    <video
                      src={reel.videoUrl}
                      className="h-full w-full object-cover"
                      autoPlay={false}
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      poster={reel.thumbnailUrl || undefined}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-light-3 max-w-[64px] truncate text-center">
                  {reel.creator?.name || "Reel"}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>

      <Dialog open={isUploadModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="bg-dark-2 border-dark-4 text-light-1">
          <DialogHeader>
            <DialogTitle>Upload Reel</DialogTitle>
            <DialogDescription className="text-light-3">
              Add a short caption and choose a small video file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={120}
              placeholder="Add reel caption..."
              className="h-10 bg-dark-4 border-dark-4"
            />

            <button
              type="button"
              onClick={handlePickVideo}
              className="w-full rounded-md border border-dark-4 bg-dark-4 px-4 py-2 text-sm text-light-2 hover:bg-dark-3 transition"
            >
              {selectedFile ? `Selected: ${selectedFile.name}` : "Select video"}
            </button>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={handleUploadVideo}
              disabled={isUploading || !selectedFile}
              className="shad-button_primary px-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Upload Reel"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReelsBar;
