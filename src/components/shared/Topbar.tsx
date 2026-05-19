import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignOutAccount } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";
// import ChatNotificationIcon from "./ChatNotificationIcon";
import NotificationTabBadge from "./NotificationTabBadge";

const Topbar = () => {
  const { isSuccess } = useSignOutAccount();
  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess) navigate(0);
  }, [isSuccess]);

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img src="/assets/images/PhotoOp-1.svg" alt="logo" width={150} />
        </Link>
        <div className="flex gap-6">
          <Link to="/notifications" className="flex items-center relative">
            <img
              src="/assets/icons/bell.svg"
              alt="Notifications"
              width={22}
              height={22}
            />
            <NotificationTabBadge />
          </Link>
          <Link to="/settings" className="flex items-center">
            <img
              src="/assets/icons/settings.png"
              alt="Settings"
              width={22}
              height={22}
            />
          </Link>
          <Link to={`/profile/${user.id}`} className="flex-center gap-3">
            <img
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-8 w-8 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Topbar;
