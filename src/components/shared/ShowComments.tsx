import { useGetPostComments } from "@/lib/react-query/queriesAndMutations";
import { Loader } from ".";
import CommentCard from "./CommentCard";
import { useUserContext } from "@/context/AuthContext";

interface ShowCommentProps {
  postId?: string;
  limit?: number;
  sortOrder?: "newest" | "oldest";
}
const ShowComments = ({
  postId,
  limit,
  sortOrder = "newest",
}: ShowCommentProps) => {
  const { isAuthenticated, isLoading } = useUserContext();
  const {
    data: comments,
    isPending: isCommentCreating,
    isError,
    error,
  } = useGetPostComments(postId || "", isAuthenticated);

  if (isLoading) return <Loader />;

  if (!isAuthenticated) {
    return (
      <div className="w-full py-4 text-center text-light-3 small-medium">
        Sign in to view comments.
      </div>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const isUnauthorized =
      message.includes("401") ||
      message.includes("unauthorized") ||
      message.includes("user_unauthorized");

    return (
      <div className="w-full py-4 text-center text-light-3 small-medium">
        {isUnauthorized
          ? "You do not have permission to view these comments right now."
          : "We could not load comments right now. Please try again."}
      </div>
    );
  }

  const sortedDocuments =
    sortOrder === "oldest"
      ? [...(comments?.documents || [])].reverse()
      : comments?.documents || [];

  return (
    <>
      {isCommentCreating ? (
        <Loader />
      ) : (
        (typeof limit === "number"
          ? sortedDocuments.slice(0, limit)
          : sortedDocuments
        ).map((comment) => <CommentCard comment={comment} key={comment.$id} />)
      )}
    </>
  );
};

export default ShowComments;
