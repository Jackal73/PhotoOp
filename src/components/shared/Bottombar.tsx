import { Link, useLocation } from "react-router-dom";

import { bottombarLinks } from "@/constants";
import ChatNotificationIcon from "./ChatNotificationIcon";
import NotificationTabBadge from "./NotificationTabBadge";

const Bottombar = () => {
  const { pathname } = useLocation();

  return (
    <section className="bottom-bar">
      {bottombarLinks.map((link) => {
        const isActive = pathname === link.route;
        return (
          <Link
            key={`bottombar-${link.label}`}
            to={link.route}
            className={`flex-center flex-col gap-1 p-2 transition${isActive ? " rounded-[10px] bg-primary-500" : ""}`}
          >
            {link.route === "/chats" ? (
              <ChatNotificationIcon
                size={22}
                className={`${isActive ? "[&>img]:invert-white" : ""}`}
              />
            ) : (
              <img
                src={link.imgURL}
                alt={link.label}
                width={22}
                height={22}
                className={`${isActive && "invert-white"}`}
              />
            )}

            <p className="text-sm text-light-2 font-semibold">{link.label}</p>
          </Link>
        );
      })}
    </section>
  );
};

export default Bottombar;
