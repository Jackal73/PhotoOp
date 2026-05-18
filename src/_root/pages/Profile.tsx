import { useState, useEffect } from "react";
import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";

import { Button } from "@/components/ui";
import { LikedPosts } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import {
  useGetUserById,
  useGetUserPosts,
  useGetFollowDocument,
  useFollowUser,
  useUnfollowUser,
  useGetFollowers,
  useGetFollowing,
  useGetPendingFollowRequests,
  useGetUsersByIds,
} from "@/lib/react-query/queriesAndMutations";
import {
  GridPostList,
  Loader,
  FollowRequestCard,
  FollowListDialog,
} from "@/components/shared";

interface StatBlockProps {
  value: string | number;
  label: string;
  onClick?: () => void;
}

const StatBlock = ({ value, label, onClick }: StatBlockProps) => (
  <div
    className={`flex-center gap-2 ${onClick ? "cursor-pointer hover:opacity-80 transition" : ""}`}
    onClick={onClick}
  >
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();

  const { data: currentUser } = useGetUserById(id || "");
  const { data: userPostsData, isLoading: isLoadingUserPosts } =
    useGetUserPosts(id || "");
  const userPosts = userPostsData?.documents || [];

  // Follow state
  const isUserReady = !!user && !!user.id && !!id;
  const { data: followDoc } = useGetFollowDocument(
    isUserReady ? user.id : "",
    isUserReady ? id : "",
  );
  const { mutate: follow, isPending: isSendingFollow } = useFollowUser();
  const { mutate: unfollow, isPending: isUnfollowing } = useUnfollowUser();
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localDocId, setLocalDocId] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(followDoc ? (followDoc.status as string) : null);
    setLocalDocId(followDoc?.$id || null);
  }, [followDoc]);

  // Follower / following counts
  const { data: followerDocs = [] } = useGetFollowers(isUserReady ? id : "");
  const { data: followingDocs = [] } = useGetFollowing(isUserReady ? id : "");

  // Pending requests (only visible to profile owner)
  const isOwnProfile = user.id === id;
  const { data: pendingRequests = [] } = useGetPendingFollowRequests(
    isOwnProfile && isUserReady ? id : "",
  );
  const pendingRequesterIds = pendingRequests.map(
    (doc: any) => doc.followerId as string,
  );
  const { data: pendingRequestersResult } =
    useGetUsersByIds(pendingRequesterIds);
  const pendingRequesters = pendingRequestersResult?.documents || [];

  // Follow list dialog state
  const [followListDialog, setFollowListDialog] = useState<
    "followers" | "following" | null
  >(null);

  const handleFollowToggle = () => {
    if (localStatus && localDocId) {
      setLocalStatus(null);
      setLocalDocId(null);
      unfollow({
        followDocumentId: localDocId,
      });
    } else {
      setLocalStatus("pending");
      console.log("Current user ID (followerId):", user.id);
      console.log("Target user ID (followingId):", id);
      follow({ followerId: user.id, followingId: id || "" });
    }
  };

  const followButtonLabel = () => {
    if (localStatus === "accepted") return "Following";
    if (localStatus === "pending") return "Requested";
    return "Follow";
  };

  const followButtonClass = () => {
    if (localStatus === "accepted" || localStatus === "pending")
      return "shad-button_dark_4 px-8";
    return "shad-button_primary px-8";
  };

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={
              currentUser.imageUrl || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full"
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {currentUser.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser.username}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={userPosts.length} label="Posts" />
              <StatBlock
                value={followerDocs.length}
                label="Followers"
                onClick={() => setFollowListDialog("followers")}
              />
              <StatBlock
                value={followingDocs.length}
                label="Following"
                onClick={() => setFollowListDialog("following")}
              />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
              {currentUser.bio}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <div className={`${user.id !== currentUser.$id && "hidden"}`}>
              <Link
                to={`/update-profile/${currentUser.$id}`}
                className={`h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg ${
                  user.id !== currentUser.$id && "hidden"
                }`}
              >
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            </div>
            {!isOwnProfile && (
              <Button
                type="button"
                disabled={isSendingFollow || isUnfollowing}
                onClick={handleFollowToggle}
                className={followButtonClass()}
              >
                {followButtonLabel()}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pending follow requests panel (own profile only) */}
      {isOwnProfile && pendingRequests.length > 0 && (
        <div className="w-full max-w-5xl bg-dark-2 border border-dark-4 rounded-2xl p-5">
          <h3 className="base-semibold text-light-1 mb-1">
            Follow Requests
            <span className="ml-2 text-primary-500">
              {pendingRequests.length}
            </span>
          </h3>
          <p className="tiny-medium text-light-4 mb-4">
            These people want to follow you.
          </p>
          <div className="flex flex-col divide-y divide-dark-4">
            {pendingRequests.map((reqDoc: any) => {
              const requester = pendingRequesters.find(
                (u: any) => u.$id === reqDoc.followerId,
              );
              if (!requester) return null;
              return (
                <FollowRequestCard
                  key={reqDoc.$id}
                  followDoc={reqDoc}
                  requester={requester}
                />
              );
            })}
          </div>
        </div>
      )}

      {currentUser.$id === user.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${pathname === `/profile/${id}` && "!bg-dark-3"}`}
          >
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab rounded-r-lg ${pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"}`}
          >
            Liked Posts
          </Link>
        </div>
      )}

      <Routes>
        <Route
          index
          element={
            isLoadingUserPosts ? (
              <Loader />
            ) : (
              <GridPostList posts={userPosts} showUser={false} />
            )
          }
        />
        {currentUser.$id === user.id && (
          <Route
            path="/liked-posts"
            element={<LikedPosts liked={currentUser.liked || []} />}
          />
        )}
      </Routes>
      <Outlet />

      {/* Followers / Following list dialogs */}
      <FollowListDialog
        open={followListDialog === "followers"}
        onClose={() => setFollowListDialog(null)}
        title="Followers"
        followDocs={followerDocs as any[]}
        idField="followerId"
      />
      <FollowListDialog
        open={followListDialog === "following"}
        onClose={() => setFollowListDialog(null)}
        title="Following"
        followDocs={followingDocs as any[]}
        idField="followingId"
      />
    </div>
  );
};

export default Profile;
