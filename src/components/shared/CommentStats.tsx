import { useUserContext } from "@/context/AuthContext";
import { useLikeComment } from "@/lib/react-query/queriesAndMutations";
import { checkIsLiked } from "@/lib/utils";
import { Models } from "appwrite";
import { useEffect, useState } from "react";
import ChildCommentDialog from "./ChildCommentDialog";

interface CommentStatsProps {
  comment: Models.Document;
}

const CommentStats = ({ comment }: CommentStatsProps) => {
  const { user } = useUserContext();
  const { mutate: likeComment } = useLikeComment();
  const likesList: string[] = (comment?.likes || [])
    .map((like: string | Models.Document) =>
      typeof like === "string" ? like : like?.$id,
    )
    .filter((id: any): id is string => Boolean(id));

  const [likes, setLikes] = useState<string[]>(likesList);

  useEffect(() => {
    setLikes(likesList);
  }, [comment?.likes]);

  const handleLikePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hasLiked = likes.includes(user.id);
    const newLikes = hasLiked
      ? likes.filter((id) => id !== user.id)
      : [...likes, user.id];

    setLikes(newLikes);
    likeComment({ commentId: comment.$id, likesArray: newLikes });
  };

  return (
    <div className="z-20 flex items-center justify-between">
      <div className="mr-5 flex items-center justify-center gap-3">
        <img
          src={
            checkIsLiked(likes, user.id)
              ? "/assets/icons/liked.svg"
              : "/assets/icons/like.svg"
          }
          alt="Like"
          width={15}
          height={15}
          onClick={handleLikePost}
          className="cursor-pointer"
        />
        <p className="small-medium lg:text-sm">{likes.length}</p>

        <ChildCommentDialog comment={comment} />
      </div>
    </div>
  );
};

export default CommentStats;
