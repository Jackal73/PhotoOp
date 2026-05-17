import { Models } from "appwrite";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetUsersByIds } from "@/lib/react-query/queriesAndMutations";
import Loader from "./Loader";

type FollowListDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  followDocs: Models.Document[]; // array of follow docs
  idField: "followerId" | "followingId"; // which field holds the user ID to display
};

const FollowListDialog = ({
  open,
  onClose,
  title,
  followDocs,
  idField,
}: FollowListDialogProps) => {
  const userIds = followDocs.map((doc) => doc[idField] as string);
  const { data: usersResult, isLoading } = useGetUsersByIds(userIds);
  const users = usersResult?.documents || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-dark-2 border border-dark-4 max-w-sm w-full rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-light-1 base-semibold">{title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-center py-6">
            <Loader />
          </div>
        ) : users.length === 0 ? (
          <p className="text-light-4 small-regular text-center py-6">No users yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-dark-4 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <li key={user.$id} onClick={onClose}>
                <Link
                  to={`/profile/${user.$id}`}
                  className="flex items-center gap-3 py-3 px-1 hover:bg-dark-3 rounded-lg transition"
                >
                  <img
                    src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="small-semibold text-light-1 truncate">{user.name}</p>
                    <p className="tiny-medium text-light-3 truncate">@{user.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FollowListDialog;
