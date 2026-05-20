import React from "react";
import { Loader } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";
import { useGetNotifications } from "@/lib/react-query/queriesAndMutations";
import { useMarkNotificationAsRead } from "@/lib/react-query/queriesAndMutations";
import { multiFormatDateString } from "@/lib/utils";

const notificationIcons: Record<string, string> = {
  like: "/assets/icons/like.svg",
  comment: "/assets/icons/comment.svg",
  follow: "/assets/icons/people.svg",
  mention: "/assets/icons/mention.svg",
  system: "/assets/icons/bell.svg",
};

const Notifications: React.FC = () => {
  const { user } = useUserContext();
  const { data: notifications = [], isLoading } = useGetNotifications(user.id);
  const markAsRead = useMarkNotificationAsRead(user.id);

  const handleView = (notificationId: string, link: string) => {
    markAsRead.mutate(notificationId);
    window.location.href = link;
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Your Notifications</h2>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader />
        </div>
      ) : unreadNotifications.length === 0 ? (
        <div className="text-center text-light-3 py-12">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {unreadNotifications.map((n) => (
            <li
              key={n.$id}
              className={`bg-white dark:bg-dark-2 rounded-lg shadow p-4 flex items-center gap-3 border-l-4 border-primary-500`}
            >
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <img
                  src={notificationIcons[n.type] || notificationIcons.system}
                  alt={n.type}
                  className="w-6 h-6"
                />
              </div>
              <div className="flex-1">
                <div className="font-medium text-light-1">
                  {n.message}
                  {typeof n.link === "string" && typeof n.$id === "string" && (
                    <a
                      href={n.link}
                      className="ml-2 text-primary-500 underline hover:text-primary-400"
                      onClick={(e) => {
                        e.preventDefault();
                        handleView(n.$id as string, n.link as string);
                      }}
                    >
                      View
                    </a>
                  )}
                </div>
                <div className="text-xs text-light-3 mt-1">
                  {multiFormatDateString(n.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
