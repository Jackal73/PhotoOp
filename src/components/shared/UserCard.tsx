import { useState, useEffect } from "react";
import { Models } from "appwrite";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";
import { useUserContext } from "@/context/AuthContext";
import {
  useGetFollowDocument,
  useFollowUser,
  useUnfollowUser,
} from "@/lib/react-query/queriesAndMutations";

type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
  const { user: currentUser } = useUserContext();
  const isCurrentUser = currentUser.id === user.$id;

  const { data: followDoc } = useGetFollowDocument(currentUser.id, user.$id);
  const { mutate: follow, isPending: isFollowing } = useFollowUser();
  const { mutate: unfollow, isPending: isUnfollowing } = useUnfollowUser();

  // local optimistic state: null | "pending" | "accepted"
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localDocId, setLocalDocId] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(followDoc ? (followDoc.status as string) : null);
    setLocalDocId(followDoc?.$id || null);
  }, [followDoc]);

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (localStatus && localDocId) {
      // Cancel request or unfollow
      setLocalStatus(null);
      setLocalDocId(null);
      unfollow({ followDocumentId: localDocId, followerId: currentUser.id, followingId: user.$id });
    } else {
      // Send follow request
      setLocalStatus("pending");
      follow({ followerId: currentUser.id, followingId: user.$id });
    }
  };

  const buttonLabel = () => {
    if (localStatus === "accepted") return "Following";
    if (localStatus === "pending") return "Requested";
    return "Follow";
  };

  const buttonClass = () => {
    if (localStatus === "accepted") return "shad-button_dark_4 px-5";
    if (localStatus === "pending") return "shad-button_dark_4 px-5";
    return "shad-button_primary px-5";
  };

  return (
    <Link to={`/profile/${user.$id}`} className="user-card">
      <img
        src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
        alt="creator"
        className="rounded-full w-14 h-14"
      />

      <div className="flex-center flex-col gap-1">
        <p className="base-medium text-light-1 text-center line-clamp-1">{user.name}</p>
        <p className="small-regular text-light-3 text-center line-clamp-1">@{user.username}</p>
      </div>

      <div className="h-9 flex items-center">
        {!isCurrentUser ? (
          <Button
            type="button"
            size="sm"
            onClick={handleFollowToggle}
            disabled={isFollowing || isUnfollowing}
            className={buttonClass()}
          >
            {buttonLabel()}
          </Button>
        ) : (
          <span className="invisible">Follow</span>
        )}
      </div>
    </Link>
  );
};

export default UserCard;

