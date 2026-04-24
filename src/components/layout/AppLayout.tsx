import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
