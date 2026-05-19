import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { INavLink } from "@/types";
import { sidebarLinks } from "@/constants";
import { Loader } from "@/components/shared";
import ChatNotificationIcon from "@/components/shared/ChatNotificationIcon";
import NotificationTabBadge from "@/components/shared/NotificationTabBadge";
import { Button } from "@/components/ui/button";
import { useSignOutAccount } from "@/lib/react-query/queriesAndMutations";
import { useUserContext, INITIAL_USER } from "@/context/AuthContext";
// import { useEffect } from "react";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, setUser, setIsAuthenticated, isLoading } = useUserContext();

  const { mutate: signOut } = useSignOutAccount();
  const handleSignOut = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    signOut();
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    navigate("/sign-in");
  };

  // useEffect(() => {
  //   if (isSuccess) navigate(0);
  // }, [isSuccess]);

  return (
    <>
      <nav className="leftsidebar">
        <div className="flex flex-col gap-11">
          <Link to="/" className="flex gap-3 items-center">
            <img
              src="/assets/images/PhotoOp-1.svg"
              alt="logo"
              width={170}
              height={36}
            />
          </Link>
          {isLoading || !user.email ? (
            <div className="h-14">
              <Loader />
            </div>
          ) : (
            <Link
              to={`/profile/${user.id}`}
              className="flex gap-3 items-center"
            >
              <img
                src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt="profile"
                className="h-14 w-14 rounded-full"
              />
              <div className="flex flex-col">
                <p className="body-bold">{user.name}</p>
                <p className="small-regular text-light-3">@{user.username}</p>
              </div>
            </Link>
          )}
          <ul className="flex flex-col gap-3">
            {sidebarLinks.map((link: INavLink) => {
              const isActive = pathname === link.route;

              return (
                <li
                  key={link.label}
                  className={`leftsidebar-link group ${isActive && "bg-primary-500"}`}
                >
                  <NavLink
                    to={link.route}
                    className="flex gap-3 items-center px-4 py-3"
                  >
                    {link.route === "/chats" ? (
                      <ChatNotificationIcon
                        size={20}
                        className={`${isActive ? "[&>img]:invert-white" : "group-hover:[&>img]:invert-white"}`}
                      />
                    ) : link.route === "/notifications" ? (
                      <span className="relative">
                        <img
                          src={link.imgURL}
                          alt={link.label}
                          className={`group-hover:invert-white ${isActive && "invert-white"}`}
                        />
                        <NotificationTabBadge />
                      </span>
                    ) : (
                      <img
                        src={link.imgURL}
                        alt={link.label}
                        className={`group-hover:invert-white ${isActive && "invert-white"}`}
                      />
                    )}
                    {link.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className={`leftsidebar-link group flex gap-3 items-center px-4 py-3 w-full justify-start ${pathname === "/settings" ? "bg-primary-500" : ""}`}
          >
            <img
              src="/assets/icons/settings.png"
              alt="settings"
              className={`w-6 h-6 group-hover:invert-white ${pathname === "/settings" ? "invert-white" : ""}`}
            />
            <span className="body-medium">Settings</span>
          </button>
          <Button
            variant="ghost"
            className="shad-button_ghost mt-6"
            onClick={(e) => handleSignOut(e)}
          >
            <img src="/assets/icons/logout.svg" alt="logout" />
            <p className="small-medium lg:base-medium">Sign Out</p>
          </Button>
        </div>
      </nav>
    </>
  );
};

export default LeftSidebar;
