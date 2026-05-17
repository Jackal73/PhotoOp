import { Outlet, useLocation } from "react-router-dom";

import Topbar from "@/components/shared/Topbar";
import Bottombar from "@/components/shared/Bottombar";
import LeftSidebar from "@/components/shared/LeftSidebar";
import ReelsBar from "@/components/shared/ReelsBar";

const RootLayout = () => {
  const { pathname } = useLocation();
  const shouldShowReelsBar = pathname === "/" || pathname.startsWith("/reels");

  return (
    <div className="w-full md:flex">
      <Topbar />
      <LeftSidebar />

      <section className="flex flex-1 h-full flex-col">
        {shouldShowReelsBar && <ReelsBar />}
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </section>

      <Bottombar />
    </div>
  );
};

export default RootLayout;
