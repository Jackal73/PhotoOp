import { multiFormatDateString } from "@/lib/utils";
import { Models } from "appwrite";
import CommentStats from "./CommentStats";
import {
  useDeleteComment,
  useGetChildComments,
  useGetUserById,
} from "@/lib/react-query/queriesAndMutations";
import { useState } from "react";
import { useUserContext } from "@/context/AuthContext";

interface CommentCardProps {
  comment: Models.Document;
  showStats?: boolean;
  showReplies?: boolean;
  nestLevel?: number;
}
const CommentCard = ({
  comment,
  showStats = true,
  showReplies = true,
  nestLevel = 0,
}: CommentCardProps) => {
  const commentUserId =
    typeof comment.user === "string" ? comment.user : comment.user?.$id || "";

  const { data: commentUser } = useGetUserById(commentUserId);
  const { data: childComments } = useGetChildComments(comment.$id, showReplies);
  const childCommentDocuments = childComments?.documents || [];

  const commentCreator =
    typeof comment.user === "object" && comment.user
      ? comment.user
      : commentUser;

  const { user: currentUser } = useUserContext();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const isOwner = currentUser.id === commentUserId;
  const parentCommentID =
    typeof comment.parentCommentID === "string"
      ? comment.parentCommentID
      : null;
  const postId =
    typeof comment.post === "string" ? comment.post : comment.post?.$id;

  const avatarSizeClass = nestLevel > 0 ? "h-6 w-6" : "h-8 w-8";
  const replyToggleIndentClass = nestLevel > 0 ? "ml-8" : "ml-10";
  const commentSpacingClass = nestLevel > 0 ? "pb-1" : "pb-4";
  const usernameTextClass = nestLevel > 0 ? "text-xs" : "text-sm";
  const commentTextClass = nestLevel > 0 ? "text-sm" : "text-base";
  const [showChildReplies, setShowChildReplies] = useState(false);

  return (
    <div
      className={`${commentSpacingClass} ${nestLevel > 0 ? "border-l border-dark-3 pl-4" : ""}`}
    >
      <div className="flex gap-2">
        <img
          className={`${avatarSizeClass} rounded-full object-cover`}
          src={
            commentCreator?.imageUrl || "/assets/icons/profile-placeholder.svg"
          }
          alt="user"
        />
        <div className="mr-3 flex w-full flex-col items-start justify-center gap-1">
          <div className="flex min-w-full items-center justify-between">
            <p
              className={`text-color-bg-dark-2 text-nowrap text-light-3 ${usernameTextClass}`}
            >
              {commentCreator?.name || "Unknown user"}
            </p>
            {isOwner && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  deleteComment({
                    commentId: comment.$id,
                    postId,
                    parentCommentID,
                  })
                }
                className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
              >
                <img
                  src="/assets/icons/delete.svg"
                  alt="delete"
                  width={16}
                  height={16}
                />
              </button>
            )}
          </div>
          <div className="flex w-full items-start justify-between gap-2">
            <p className={`${commentTextClass} ${!showStats && "text-white"}`}>
              {comment.comment_text}
            </p>
            {showStats && <CommentStats comment={comment} />}
          </div>
          <p className="text-xs text-light-4">
            {multiFormatDateString(comment.$createdAt)}
          </p>
        </div>
      </div>

      {showReplies && childCommentDocuments.length > 0 && (
        <div className={`mt-0.5 ${replyToggleIndentClass}`}>
          <button
            type="button"
            onClick={() => setShowChildReplies((prev) => !prev)}
            className="small-medium text-light-4 hover:text-light-2"
          >
            {showChildReplies
              ? `Hide replies (${childCommentDocuments.length})`
              : `View replies (${childCommentDocuments.length})`}
          </button>

          {showChildReplies && (
            <div className="mt-0.5 flex flex-col gap-1">
              {childCommentDocuments.map((childComment) => (
                <CommentCard
                  key={childComment.$id}
                  comment={childComment}
                  showStats
                  showReplies
                  nestLevel={nestLevel + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentCard;
