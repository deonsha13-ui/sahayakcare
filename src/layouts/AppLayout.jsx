import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { navigation } from "@/data/navigation";
import { useDemo } from "@/context/DemoContext";
export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  const { settings, updateSettings, notice } = useDemo();
  const [menu, setMenu] = useState(false);
  const current = navigation.find((n) => n.to === pathname);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <Link to="/" className="brand">
          <span className="brand-symbol">
            <Activity />
          </span>
          <span>
            Sahayak<span className="brand-sub">CARE, IN EVERY CONVERSATION</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="close-menu"
          onClick={() => setMenu(false)}
          aria-label="Close navigation"
        >
          <X />
        </Button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenu(false)}
              className={`nav-item ${pathname === to ? "active" : ""}`}
            >
              <Icon size={19} />
              <span>{label}</span>
              {to === "/live-visit" && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="care-note">
            <HeartHandshake />
            <strong>
              A little support.
              <br />A lot of care.
            </strong>
            <p>Your companion for every home visit.</p>
            <span>
              <ShieldCheck size={14} /> Demo workspace
            </span>
          </div>
          <Link to="/settings" className="worker-profile">
            <span className="avatar">SD</span>
            <span>
              <strong>{settings.worker}</strong>
              <small>ASHA Health Worker</small>
            </span>
            <ChevronDown size={16} />
          </Link>
        </div>
      </aside>
      {menu && <div className="menu-backdrop" onClick={() => setMenu(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{current?.label || "Sahayak"}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="connection">
              <i /> Demo connected
            </span>
            <div className="language">
              <select
                aria-label="Language"
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
                <option>Kannada</option>
                <option>Malayalam</option>
                <option>Bengali</option>
                <option>Marathi</option>
              </select>
              <ChevronDown size={14} />
            </div>
            <Link to="/settings" aria-label="Your profile" className="avatar small">
              SD
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <span>
            <Activity size={14} /> Sahayak · Built around care
          </span>
          <span>
            Frontend demo <span className="footer-dot">·</span> Synthetic data only{" "}
            <ArrowUpRight size={12} />
          </span>
        </footer>
      </div>
      {notice && (
        <div role="status" className="toast">
          <ShieldCheck size={19} />
          {notice}
        </div>
      )}
    </div>
  );
}
