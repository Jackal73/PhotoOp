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

  const handleUploadVideo = () => {
    if (!selectedFile) {
      toast({
        title: "Select a video",
        description: "Choose a video file before uploading.",
      });
      return;
    }

    createReel(
      {
        userId: user.id,
        caption: caption.trim(),
        file: selectedFile,
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
        <div className="flex items-start gap-3 overflow-x-auto px-4 py-4 custom-scrollbar">
          <div className="shrink-0 w-[72px] flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              disabled={isUploading}
              className="h-16 w-16 rounded-full border-2 border-dashed border-primary-500 flex-center text-xs text-light-2 hover:bg-dark-3 transition disabled:opacity-60"
              title="Upload reel"
            >
              {isUploading ? "..." : "+"}
            </button>
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
                    <video
                      src={reel.videoUrl}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
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
