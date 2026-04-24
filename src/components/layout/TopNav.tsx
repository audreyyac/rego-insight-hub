import { NavLink, Link } from "react-router-dom";
import logo from "@/assets/regosaurus-logo.png";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/profiles", label: "My Devices" },
  { to: "/reports", label: "Reports" },
];

const TopNav = () => {
  return (
    <header className="sticky top-0 z-40 h-[52px] bg-card border-b" style={{ borderBottomWidth: "0.5px" }}>
      <div className="mx-auto h-full max-w-[1200px] px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Regosaurus" className="h-7 w-auto" />
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
          <button className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Help
          </button>
          <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-[12px] font-medium text-foreground">
            AK
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
