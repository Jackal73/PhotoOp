import { useUserContext } from "@/context/AuthContext";
import {
  useGetPendingFollowRequests,
  useAcceptFollowRequest,
  useDeclineFollowRequest,
} from "@/lib/react-query/queriesAndMutations";
import { useGetUserById } from "@/lib/react-query/queriesAndMutations";
import { Button } from "../ui/button";

export default function FollowRequestList() {
  const { user } = useUserContext();
  const { data: pendingRequests, isLoading } = useGetPendingFollowRequests(
    user.id,
  );
  const { mutate: accept, isPending: isAccepting } = useAcceptFollowRequest();
  const { mutate: decline, isPending: isDeclining } = useDeclineFollowRequest();

  if (isLoading) return <div>Loading follow requests...</div>;
  if (!pendingRequests || pendingRequests.length === 0)
    return <div>No pending follow requests.</div>;

  return (
    <div className="follow-request-list">
      <h2 className="mb-2 font-bold">Pending Follow Requests</h2>
      {pendingRequests.map((req: any) => (
        <FollowRequestCard
          key={req.$id}
          request={req}
          onAccept={() =>
            accept({
              followDocumentId: req.$id,
              followerId: req.followerId,
              followingId: req.followingId,
            })
          }
          onDecline={() =>
            decline({
              followDocumentId: req.$id,
              followerId: req.followerId,
              followingId: req.followingId,
            })
          }
          isAccepting={isAccepting}
          isDeclining={isDeclining}
        />
      ))}
    </div>
  );
}

function FollowRequestCard({
  request,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: any) {
  // Optionally fetch user info for display
  const { data: follower } = useGetUserById(request.followerId);
  return (
    <div className="flex items-center gap-4 p-2 border-b border-dark-4">
      <div className="flex items-center gap-2">
        <img
          src={follower?.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt={follower?.name || request.followerId}
          className="w-8 h-8 rounded-full"
        />
        <span className="font-medium">
          {follower?.name || request.followerId}
        </span>
        <span className="text-xs text-light-3">@{follower?.username}</span>
      </div>
      <div className="ml-auto flex gap-2">
        <Button type="button" onClick={onAccept} disabled={isAccepting}>
          Accept
        </Button>
        <Button type="button" onClick={onDecline} disabled={isDeclining}>
          Decline
        </Button>
      </div>
    </div>
  );
}
