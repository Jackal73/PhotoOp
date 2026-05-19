import { Outlet, useLocation } from "react-router-dom";

import Topbar from "@/components/shared/Topbar";
import Bottombar from "@/components/shared/Bottombar";
import LeftSidebar from "@/components/shared/LeftSidebar";
import ReelsBar from "@/components/shared/ReelsBar";

const RootLayout = () => {
  const { pathname } = useLocation();
  const shouldShowReelsBar = pathname === "/" || pathname.startsWith("/reels");

  // Heights must match Topbar and Bottombar (py-4 = h-16 = 64px)
  // On md+ screens, bars are hidden, so padding is 0
  return (
    <div className="w-full min-h-screen md:flex bg-dark-1">
      <Topbar />
      <LeftSidebar />
      <Bottombar />

      {/* Main scrollable content with padding for bars on mobile */}
      <main
        className="flex flex-1 flex-col min-h-screen overflow-hidden pt-16 pb-20 md:pt-0 md:pb-0"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {shouldShowReelsBar && <ReelsBar />}
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RootLayout;
