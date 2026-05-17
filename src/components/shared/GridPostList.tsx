import { Models } from "appwrite";
import { Link } from "react-router-dom";

import { PostStats } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";

type GridPostListProps = {
  posts: Models.Document[];
  showUser?: boolean;
  showStats?: boolean;
};

const GridPostList = ({
  posts,
  showUser = true,
  showStats = true,
}: GridPostListProps) => {
  const { user } = useUserContext();

  console.log(posts, showUser, showStats);

  return (
    <ul className="grid-container">
      {posts.map((post) => (
        <li
          key={post.$id}
          className="post-card bg-dark-2 rounded-xl shadow flex flex-col overflow-hidden"
          style={{ height: "340px", minHeight: "340px", maxHeight: "340px" }}
        >
          <Link
            to={`/posts/${post.$id}`}
            className="block w-full h-[240px] flex items-center justify-center"
            style={{ flex: "1 1 auto" }}
          >
            <img
              src={post.imageUrl}
              alt="post"
              className="max-w-full max-h-full object-contain bg-dark-1"
              style={{ height: "100%", width: "100%" }}
            />
          </Link>
          {showStats && (
            <div
              className="w-full flex items-center justify-center px-4 pt-2 pb-0 mb-0"
              style={{ marginBottom: 0, paddingBottom: 0 }}
            >
              <PostStats post={post} userId={user.id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default GridPostList;
