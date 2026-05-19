import { Models } from "appwrite";
import { Link } from "react-router-dom";
import { PostStats } from "@/components/shared";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";
import { CreateComment } from "@/components/shared";
import { ShowComments } from "@/components/shared";
import { useState } from "react";
import { useGetPostComments } from "@/lib/react-query/queriesAndMutations";

type PostCardProps = {
  post: Models.Document;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();
  const [showAllComments, setShowAllComments] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { isAuthenticated } = useUserContext();
  const { data: postComments } = useGetPostComments(post.$id, isAuthenticated);
  const totalComments = postComments?.total ?? 0;

  if (!post.creator) return;

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator.$id}`}>
            <img
              src={
                post.creator?.imageUrl ||
                "/assets/icons/profile-placeholder.svg"
              }
              alt="creator"
              className="w-12 lg:h-12 rounded-full"
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post?.creator.name}
            </p>
            <div className="flex-start text-light-3 mt-[-2px]">
              <p className="subtle-semibold">
                {multiFormatDateString(post?.$createdAt)}
              </p>
            </div>
            <div className="flex-start text-light-3 mt-[-2px]">
              <p className="subtle-semibold">{post?.location}</p>
            </div>
          </div>
        </div>

        <Link
          to={`/update-post/${post.$id}`}
          className={`${user.id !== post.creator.$id && "hidden"}`}
        >
          <img
            src={"/assets/icons/edit.svg"}
            alt="edit"
            width={20}
            height={20}
          />
        </Link>
      </div>

      <Link to={`/posts/${post.$id}`}>
        <div className="text-base py-5">
          <p className="font-medium">{post.caption}</p>
          <ul className="flex gap-1 mt-2">
            {post.tags.map((tag: string, index: string) => (
              <li key={`${tag}${index}`} className="text-light-3 small-regular">
                #{tag}
              </li>
            ))}
          </ul>
        </div>

        <img
          src={post.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="post image"
          className="post-card_img"
        />
      </Link>

      <PostStats post={post} userId={user.id} />
      {
        // post.comments.length > 0 &&
        <div className="comments-container bg-dark-2 mt-5">
          {totalComments > 0 && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === "newest" ? "oldest" : "newest",
                  )
                }
                className="text-[7px] text-light-4 hover:text-light-2 transition flex items-center gap-1"
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
          )}
          <ShowComments
            postId={post.$id}
            limit={showAllComments ? undefined : 2}
            sortOrder={sortOrder}
          />
          {totalComments > 2 && (
            <button
              type="button"
              onClick={() => setShowAllComments((prev) => !prev)}
              className="ml-2 mt-1 text-[7px] text-light-4 hover:text-light-2"
            >
              {showAllComments
                ? "Hide comments"
                : `View all ${totalComments} comments`}
            </button>
          )}
        </div>
      }
      <CreateComment userId={user.id} post={post} />
    </div>
  );
};

export default PostCard;
