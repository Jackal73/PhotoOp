import { Models } from "appwrite";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { checkIsLiked } from "@/lib/utils";
import {
  useCreateShareEvent,
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
  useGetPostComments,
  useGetPostSharesCount,
} from "@/lib/react-query/queriesAndMutations";
import Loader from "./Loader";
import CommentsDialog from "./CommentsDialog";
import { useToast } from "../ui/use-toast";

type PostStatsProps = {
  post?: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
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
  const [copied, setCopied] = useState(false);
  const { mutate: likePost } = useLikePost();
  const { mutate: savePost, isPending: isSavingPost } = useSavePost();
  const { mutate: deleteSavePost, isPending: isDeletingSaved } =
    useDeleteSavedPost();
  const { data: postComments } = useGetPostComments(
    post?.$id || "",
    !!post?.$id && !!userId,
  );
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

  const commentsCount =
    postComments?.total ??
    postComments?.documents?.length ??
    post?.comments?.length ??
    0;
  const sharesCount = postShares?.total ?? post?.shareCount ?? 0;

  const handleSharePost = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!post?.$id) return;

    const shareUrl = `${window.location.origin}/posts/${post.$id}`;

    // 1. Try native OS share sheet (mobile) — must be in direct user gesture
    if (navigator.share) {
      navigator
        .share({
          title: "Check out this post on Photo Op",
          text: `${post?.caption ? post.caption + "\n\n" : ""}${shareUrl}`,
          url: shareUrl,
        })
        .then(() =>
          createShareEvent({ postId: post.$id, userId, channel: "native" }),
        )
        .catch((err) => {
          // AbortError = user cancelled — ignore silently
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Other native share failure: fall through not possible after .then/.catch,
          // so we do a best-effort clipboard copy here
          copyToClipboard(shareUrl, post.$id);
        });
      return;
    }

    // 2. Desktop: copy synchronously so user gesture is still active
    copyToClipboard(shareUrl, post.$id);
  };

  const copyToClipboard = (shareUrl: string, postId: string) => {
    // Synchronous textarea method — works in every browser, no permissions needed
    const textarea = document.createElement("textarea");
    textarea.value = shareUrl;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (success) {
      createShareEvent({ postId, userId, channel: "clipboard" });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Last resort: try async clipboard API
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          createShareEvent({ postId, userId, channel: "clipboard" });
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() =>
          toast({
            title: "Link",
            description: shareUrl,
          }),
        );
    }
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  return (
    <div
      className={`flex gap-3 justify-between items-center z-20 ${containerStyles}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <img
            src={`${checkIsLiked(likes, userId) ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"}`}
            alt="like"
            width={20}
            height={20}
            onClick={(e) => handleLikePost(e)}
            className="cursor-pointer"
          />
          <p className="small-medium lg:base-medium">{likes.length}</p>
        </span>

        <span className="flex items-center gap-1">
          <CommentsDialog post={post} commentsLength={commentsCount} />
        </span>

        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSharePost}
            className="flex items-center cursor-pointer group"
            title="Share post"
          >
            {copied ? (
              <span className="small-medium text-primary-500 transition-all">
                Copied!
              </span>
            ) : (
              <img
                src="/assets/icons/share.png"
                alt="share"
                width={20}
                height={20}
                className="opacity-80 group-hover:opacity-100 transition-opacity"
              />
            )}
          </button>
          <p className="small-medium lg:base-medium">{sharesCount}</p>
        </span>
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

export default PostStats;
