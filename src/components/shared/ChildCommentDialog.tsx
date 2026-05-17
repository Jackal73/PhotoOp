import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateComment from "./CreateComment";
import { useUserContext } from "@/context/AuthContext";
import { Models } from "appwrite";
import CommentCard from "./CommentCard";
import ShowNestedComments from "./ShowNestedComments";
import { useGetChildComments } from "@/lib/react-query/queriesAndMutations";

interface CommentsDialogProps {
  comment: Models.Document;
}
const ChildCommentDialog = ({ comment }: CommentsDialogProps) => {
  const { user } = useUserContext();
  const { data: childComments } = useGetChildComments(comment.$id, true);
  const childCommentDocuments = childComments?.documents || [];
  const parentPostId =
    typeof comment.post === "string" ? comment.post : comment.post?.$id;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-light-4 hover:text-light-2"
        >
          <img src="/assets/icons/chat.svg" alt="reply" className="h-4 w-4" />
          <span className="small-regular">Reply</span>
          <span className="small-regular">({childComments?.total ?? 0})</span>
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
            Replies
          </DialogTitle>
          <DialogDescription className="text-light-4">
            <CommentCard comment={comment} showStats={false} />
            Explore and engage with replies on this comment.
          </DialogDescription>
        </DialogHeader>
        <div className="comments-dialog">
          {childCommentDocuments.length === 0 ? (
            <div className="flex h-full flex-col justify-between">
              <p>Be the first to start the conversation.</p>
            </div>
          ) : (
            <div>
              {childCommentDocuments.map((childComment) => (
                <ShowNestedComments
                  key={childComment.$id}
                  commentId={childComment.$id}
                />
              ))}
            </div>
          )}
          <CreateComment
            userId={user.id}
            postId={parentPostId}
            parentCommentId={comment.$id}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChildCommentDialog;
