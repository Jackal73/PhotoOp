import { useUserContext } from "@/context/AuthContext";
import { useGetUnreadMessagesCount } from "@/lib/react-query/queriesAndMutations";

type ChatNotificationIconProps = {
  size?: number;
  className?: string;
};

const ChatNotificationIcon = ({
  size = 20,
  className = "",
}: ChatNotificationIconProps) => {
  const { user } = useUserContext();
  const { data: unreadCount = 0 } = useGetUnreadMessagesCount(
    user.id,
    !!user.id,
  );
  const showBadge = user.notificationPreferences?.messages !== false;

  return (
    <div className={`relative ${className}`}>
      <img
        src="/assets/icons/chat.svg"
        alt="Chats"
        width={size}
        height={size}
      />
      {showBadge && unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
};

export default ChatNotificationIcon;
