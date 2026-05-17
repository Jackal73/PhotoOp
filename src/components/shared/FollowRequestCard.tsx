import { Link } from "react-router-dom";
import { Models } from "appwrite";
import { Button } from "@/components/ui";
import { useAcceptFollowRequest, useDeclineFollowRequest } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";

type FollowRequestCardProps = {
  followDoc: Models.Document; // { $id, followerId, followingId, status }
  requester: Models.Document; // user doc of the person who sent the request
};

const FollowRequestCard = ({ followDoc, requester }: FollowRequestCardProps) => {
  const { user } = useUserContext();
  const { mutate: accept, isPending: isAccepting } = useAcceptFollowRequest();
  const { mutate: decline, isPending: isDeclining } = useDeclineFollowRequest();

  const handleAccept = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    accept({
      followDocumentId: followDoc.$id,
      followerId: followDoc.followerId,
      followingId: user.id,
    });
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    decline({
      followDocumentId: followDoc.$id,
      followerId: followDoc.followerId,
      followingId: user.id,
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-1">
      <Link
        to={`/profile/${requester.$id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <img
          src={requester.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt={requester.name}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="small-semibold text-light-1 truncate">{requester.name}</p>
          <p className="tiny-medium text-light-3 truncate">@{requester.username}</p>
        </div>
      </Link>

      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          size="sm"
          onClick={handleAccept}
          disabled={isAccepting || isDeclining}
          className="shad-button_primary px-4 h-8 text-xs"
        >
          {isAccepting ? "..." : "Accept"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleDecline}
          disabled={isAccepting || isDeclining}
          className="shad-button_dark_4 px-4 h-8 text-xs"
        >
          {isDeclining ? "..." : "Decline"}
        </Button>
      </div>
    </div>
  );
};

export default FollowRequestCard;
