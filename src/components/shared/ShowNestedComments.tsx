import { useGetCommentById } from "@/lib/react-query/queriesAndMutations";
import CommentCard from "./CommentCard";

interface Props {
  commentId: string;
}

const ShowNestedComments = ({ commentId }: Props) => {
  const { data: comment } = useGetCommentById(commentId);

  if (comment) {
    return <CommentCard comment={comment} showReplies={false} />;
  }

  return null;
};
export default ShowNestedComments;
