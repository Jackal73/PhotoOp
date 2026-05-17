import { Models } from "appwrite";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// import { useGetPostComments } from "@/lib/react-query/queriesAndMutations";

import { checkIsLiked } from "@/lib/utils";
import {
  useCreateShareEvent,
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
  useGetPostSharesCount,
} from "@/lib/react-query/queriesAndMutations";
import Loader from "./Loader";
import { useToast } from "../ui/use-toast";

type PostStatsProps = {
  post?: Models.Document;
  userId: string;
};

const PostStatsRelated = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();
  const { toast } = useToast();
  const likesList: string[] = (post?.likes || [])
    .map((like: string | Models.Document) =>
      typeof like === "string" ? like : like?.$id,
    )
    .filter((id: any): id is string => Boolean(id));

  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);

  const { mutateAsync: createShareEvent } = useCreateShareEvent();
  const { mutate: likePost } = useLikePost();
  const { mutate: savePost, isPending: isSavingPost } = useSavePost();
  const { mutate: deleteSavePost, isPending: isDeletingSaved } =
    useDeleteSavedPost();
  const { data: postShares } = useGetPostSharesCount(
    post?.$id || "",
    !!post?.$id && !!userId,
  );

  const { data: currentUser } = useGetCurrentUser();

  const savedPostRecord = currentUser?.save.find(
    (record: Models.Document) => record.post.$id === post?.$id,
  );

  useEffect(() => {
    setIsSaved(!!savedPostRecord);
  }, [currentUser]);

  useEffect(() => {
    setLikes(likesList);
  }, [post?.likes]);

  const handleLikePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
  ) => {
    e.stopPropagation();

    const hasLiked = likes.includes(userId);
    const likesArray = hasLiked
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    setLikes(likesArray);
    likePost({ postId: post?.$id || "", likesArray });
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
  ) => {
    e.stopPropagation();

    if (savedPostRecord) {
      setIsSaved(false);
      return deleteSavePost(savedPostRecord.$id);
    }

    savePost({ userId: userId, postId: post?.$id || "" });
    setIsSaved(true);
  };

  const sharesCount = postShares?.total ?? post?.shareCount ?? 0;
  const uniqueSharersCount = postShares?.uniqueSharers ?? 0;

  const handleSharePost = async (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
  ) => {
    e.stopPropagation();

    if (!post?.$id) return;

    const shareUrl = `${window.location.origin}/posts/${post.$id}`;
    const shareTitle = "Check out this post";
    const shareText = post?.caption || "Take a look at this post";

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        await createShareEvent({
          postId: post.$id,
          userId,
          channel: "native",
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      await createShareEvent({
        postId: post.$id,
        userId,
        channel: "clipboard",
      });
      toast({ title: "Post link copied to clipboard" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast({
        title: "Unable to share post",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  return (
    <div
      className={`flex gap-4 justify-between items-center z-20 ${containerStyles}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <img
            src={`${checkIsLiked(likes, userId) ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"}`}
            alt="like"
            width={20}
            height={20}
            onClick={(e) => handleLikePost(e)}
            className="cursor-pointer"
          />
          <p className="small-medium lg:base-medium">{likes?.length}</p>
        </div>

        <div className="flex items-center gap-1">
          <img
            src={"/assets/icons/share.png"}
            alt="share"
            width={20}
            height={20}
            className="cursor-pointer"
            onClick={handleSharePost}
          />
          <p className="small-medium lg:base-medium">{sharesCount}</p>
          <p className="small-regular text-light-4">({uniqueSharersCount}u)</p>
        </div>
      </div>

      <div className="flex gap-2">
        {isSavingPost || isDeletingSaved ? (
          <Loader />
        ) : (
          <img
            src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
            alt="share"
            width={20}
            height={20}
            className="cursor-pointer"
            onClick={(e) => handleSavePost(e)}
          />
        )}
      </div>
    </div>
  );
};

export default PostStatsRelated;
