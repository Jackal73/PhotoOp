import { useMemo, useState } from "react";

import { Input } from "@/components/ui";
import { useUserContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  useDeleteReel,
  useGetRecentReels,
  useUpdateReel,
} from "@/lib/react-query/queriesAndMutations";

const Reels = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [editingReelId, setEditingReelId] = useState("");
  const [editingCaption, setEditingCaption] = useState("");

  const { data: reelsData, isLoading } = useGetRecentReels();
  const { mutate: updateReel, isPending: isUpdating } = useUpdateReel();
  const { mutate: deleteReel, isPending: isDeleting } = useDeleteReel();

  const reels = reelsData?.documents || [];

  const filteredReels = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return reels;

    return reels.filter((reel) => {
      const caption = (reel.caption || "").toLowerCase();
      const creatorName = (reel.creator?.name || "").toLowerCase();
      return caption.includes(query) || creatorName.includes(query);
    });
  }, [reels, searchValue]);

  const startEditing = (reelId: string, currentCaption: string) => {
    setEditingReelId(reelId);
    setEditingCaption(currentCaption || "");
  };

  const cancelEditing = () => {
    setEditingReelId("");
    setEditingCaption("");
  };

  const saveCaption = (reelId: string) => {
    updateReel(
      { reelId, caption: editingCaption.trim() },
      {
        onSuccess: () => {
          toast({ title: "Reel updated" });
          cancelEditing();
        },
        onError: (error: any) => {
          toast({
            title: "Update failed",
            description: error?.message || "Could not update reel caption.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const removeReel = (reelId: string, videoId?: string) => {
    if (!window.confirm("Delete this reel?")) return;

    deleteReel(
      { reelId, videoId },
      {
        onSuccess: () => toast({ title: "Reel deleted" }),
        onError: (error: any) => {
          toast({
            title: "Delete failed",
            description: error?.message || "Could not delete reel.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Reels</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            height={24}
            width={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search reels"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      <div className="w-full max-w-5xl mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-light-4">Loading reels...</p>
        ) : filteredReels.length === 0 ? (
          <p className="text-light-4">
            No reels yet. Upload one from the top reels bar.
          </p>
        ) : (
          filteredReels.map((reel) => (
            <article
              key={reel.$id}
              className="rounded-2xl border border-dark-4 bg-dark-2 overflow-hidden"
            >
              <video
                src={reel.videoUrl}
                controls
                muted
                playsInline
                className="w-full h-[340px] object-cover"
              />
              <div className="p-3">
                {editingReelId === reel.$id ? (
                  <>
                    <Input
                      type="text"
                      value={editingCaption}
                      onChange={(e) => setEditingCaption(e.target.value)}
                      maxLength={120}
                      className="h-9 bg-dark-4 border-dark-4"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveCaption(reel.$id)}
                        disabled={isUpdating}
                        className="text-xs px-2 py-1 rounded bg-primary-500 disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="text-xs px-2 py-1 rounded bg-dark-4"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="small-medium text-light-1 line-clamp-2">
                    {reel.caption || "Untitled reel"}
                  </p>
                )}
                <p className="tiny-medium text-light-4 mt-1">
                  {reel.creator?.name || "Unknown creator"}
                </p>

                {(() => {
                  const creatorId =
                    typeof reel.creator === "string"
                      ? reel.creator
                      : reel.creator?.$id;
                  const isOwner = creatorId === user.id;

                  if (!isOwner || editingReelId === reel.$id) return null;

                  return (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEditing(reel.$id, reel.caption || "")
                        }
                        className="text-xs px-2 py-1 rounded bg-dark-4"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeReel(reel.$id, reel.videoId)}
                        disabled={isDeleting}
                        className="text-xs px-2 py-1 rounded bg-rose-500/80 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })()}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default Reels;
