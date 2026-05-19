import { useUserContext } from "@/context/AuthContext";
import { useGetUnreadNotificationsCount } from "@/lib/react-query/queriesAndMutations";

// This component is for the notification badge on the notifications tab
const NotificationTabBadge = () => {
  const { user } = useUserContext();
  const { data: unreadCount = 0 } = useGetUnreadNotificationsCount(
    user.id,
    !!user.id,
  );

  if (unreadCount <= 0) return null;

  return (
    <span className="absolute -right-2 -top-2 min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
};

export default NotificationTabBadge;
