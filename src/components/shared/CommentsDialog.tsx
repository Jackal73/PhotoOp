import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ShowComments from "./ShowComments";
import CreateComment from "./CreateComment";
import { useUserContext } from "@/context/AuthContext";
import { Models } from "appwrite";

interface CommentsDialogProps {
  post?: Models.Document;
  commentsLength: number;
}

const CommentsDialog = ({ post, commentsLength }: CommentsDialogProps) => {
  const { user } = useUserContext();
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src="/assets/icons/comment.png"
            alt="comment"
            width={20}
            height={20}
          />
          <p className="small-medium lg:base-medium mr-6">{commentsLength}</p>
        </button>
      </DialogTrigger>
      <DialogContent className="post-card">
        <DialogHeader className="flex flex-col gap-2">
          <DialogTitle className="flex items-center gap-2">
            {" "}
            <img
              src="/assets/icons/chat.svg"
              alt="comment"
              className="invert-white"
            />
            Comments
          </DialogTitle>
          <DialogDescription className="text-light-4">
            Explore and engage with the conversations around this post.
          </DialogDescription>
        </DialogHeader>
        <div className="comments-dialog flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="small-medium text-light-3">
              {commentsLength} {commentsLength === 1 ? "comment" : "comments"}
            </p>
            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) =>
                  prev === "newest" ? "oldest" : "newest",
                )
              }
              className="small-regular text-light-4 hover:text-light-2 transition flex items-center gap-1"
            >
              <img
                src="/assets/icons/filter.svg"
                alt="sort"
                width={14}
                height={14}
              />
              {sortOrder === "newest" ? "Newest first" : "Oldest first"}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {commentsLength === 0 ? (
              <p className="text-light-4 small-medium">
                Be the first to start the conversation.
              </p>
            ) : (
              <ShowComments postId={post?.$id} sortOrder={sortOrder} />
            )}
          </div>

          <CreateComment userId={user.id} post={post} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;
