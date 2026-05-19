import { useState } from "react";
import { PostCard, Loader, UserCard } from "@/components/shared";
import {
  useGetRecentPosts,
  useGetUsers,
  useGetFollowing,
} from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";
import { Models } from "appwrite";

const Home = () => {
  const { user } = useUserContext();
  const [feedTab, setFeedTab] = useState<"forYou" | "following">("forYou");

  const {
    data: posts,
    isPending: isPostLoading,
    isError: isErrorPosts,
  } = useGetRecentPosts();
  const {
    data: creators,
    isLoading: isUserLoading,
    isError: isErrorCreators,
  } = useGetUsers(10);
  const { data: followingDocs = [] } = useGetFollowing(user.id);

  const followingIds = new Set(
    (followingDocs as any[]).map((doc) => doc.followingId as string),
  );

  const displayPosts =
    feedTab === "following"
      ? (posts?.documents || []).filter((post: Models.Document) =>
          followingIds.has(
            typeof post.creator === "string" ? post.creator : post.creator?.$id,
          ),
        )
      : posts?.documents || [];

  if (isErrorPosts || isErrorCreators) {
    return (
      <div className="flex flex-1">
        <div className="home-container">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
        <div className="home-creators">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full md:pb-5">
      <div className="home-container">
        <div className="home-posts">
          {/* Feed tabs */}
          <div className="flex items-center gap-4 w-full mb-2">
            <h2 className="h3-bold md:h2-bold text-left">Home Feed</h2>
            <div className="flex ml-auto gap-2">
              {(["forYou", "following"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFeedTab(tab)}
                  className={`px-4 py-1.5 rounded-full small-medium transition ${
                    feedTab === tab
                      ? "bg-primary-500 text-white"
                      : "bg-dark-3 text-light-3 hover:text-light-1"
                  }`}
                >
                  {tab === "forYou" ? "For You" : "Following"}
                </button>
              ))}
            </div>
          </div>

          {isPostLoading && !posts ? (
            <Loader />
          ) : feedTab === "following" && displayPosts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 mt-16 text-light-4">
              <img
                src="/assets/icons/people.svg"
                width={48}
                height={48}
                className="opacity-40"
              />
              <p className="base-medium">
                Follow people to see their posts here.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col flex-1 gap-9 w-full">
              {displayPosts.map((post: Models.Document) => (
                <li key={post.$id} className="flex justify-center w-full">
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="home-creators">
        <h3 className="h3-bold text-light-1">Top Creators</h3>
        {isUserLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="grid 2xl:grid-cols-2 gap-6">
            {creators?.documents.map((creator) => (
              <li key={creator?.$id}>
                <UserCard user={creator} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
