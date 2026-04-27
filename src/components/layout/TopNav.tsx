import { NavLink, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import logo from "@/assets/regosaurus-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/profiles", label: "My Devices" },
];

const TopNav = () => {
  const { user, signOut } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="sticky top-0 z-40 h-[64px] bg-card border-b" style={{ borderBottomWidth: "0.5px" }}>
      <div className="mx-auto h-full max-w-[1200px] px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src={logo} alt="Regosaurus" className="h-11 w-auto" />
          <span className="text-[15px] tracking-tight text-foreground font-medium">
            Regosaurus
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-muted-foreground hidden sm:block">{user?.email}</span>
          <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-[12px] font-medium text-foreground">
            {initials}
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
