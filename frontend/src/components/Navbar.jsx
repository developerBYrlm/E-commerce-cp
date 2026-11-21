import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, Compass, MapPin, Menu, Moon, ShoppingBag, Store, Sun, X } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import toast from "react-hot-toast";

const links = [
  ["Home", "/"],
  ["Discover", "/shops"],
  ["Products", "/products"],
  ["Services", "/services"],
  ["Community", "/feed"],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("localsphere-theme") === "dark");
  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("localsphere-theme", dark ? "dark" : "light");
  }, [dark]);
  async function handleLogout() {
    try { await logout(); toast.success("You’re signed out"); navigate("/"); }
    catch (error) { toast.error(error.message); }
  }
  return <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/90 backdrop-blur-xl">
    <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">
      <Link to="/" className="flex shrink-0 items-center gap-2.5 text-forest">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest text-lime"><Compass size={22} /></span>
        <span className="text-xl font-extrabold tracking-tight">local<span className="text-emerald-600">sphere</span></span>
      </Link>
      <nav className="hidden items-center gap-1.5 lg:gap-2 md:flex">
        {links.map(([label, path]) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `relative inline-flex items-center justify-center rounded-full select-none transition-all duration-200 ease-out ${
                isActive
                  ? "bg-gradient-to-r from-[#1b3d30] via-[#244d3d] to-[#2e6e55] text-white font-bold text-sm sm:text-[14.5px] px-5 py-2 shadow-md shadow-forest/20 tracking-tight dark:from-emerald-700 dark:via-emerald-600 dark:to-teal-700 dark:text-white dark:shadow-emerald-950/40"
                  : "text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-[13px] px-3.5 py-1.5 hover:text-forest hover:bg-forest/[0.06] dark:hover:text-white dark:hover:bg-white/[0.08]"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="hidden items-center gap-3 sm:flex">
        <button className="btn btn-ghost btn-circle btn-sm" onClick={() => setDark(!dark)} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button className="btn btn-ghost btn-sm gap-2 rounded-full text-slate-600" onClick={() => navigate("/shops")}><MapPin size={16} /> Nearby</button>
        <Link to="/cart" className="btn btn-ghost btn-circle btn-sm relative" aria-label={`Shopping cart, ${itemCount} items`}><ShoppingBag size={18} />{itemCount > 0 && <span className="badge badge-sm absolute -right-1 -top-1 border-0 bg-lime text-forest">{itemCount}</span>}</Link>
        {user ? <div className="dropdown dropdown-end">
          <button tabIndex={0} className="btn btn-sm h-10 gap-2 rounded-full bg-white px-2.5 normal-case text-forest shadow-sm">
            <span className="avatar placeholder"><span className="w-7 rounded-full bg-lime text-xs font-bold text-forest">{user.name?.slice(0, 1).toUpperCase()}</span></span>
            <span className="max-w-24 truncate">{user.name}</span>
          </button>
          <ul tabIndex={0} className="menu dropdown-content z-50 mt-3 w-52 rounded-2xl bg-white p-2 shadow-xl">
            <li><Link to="/dashboard"><ShoppingBag size={16} /> Dashboard</Link></li>
            <li><Link to="/messages"><Compass size={16} /> Messages</Link></li>
            <li><Link to="/notifications"><Bell size={16} /> Notifications</Link></li>
            {user.role === "owner" && <li><Link to="/dashboard?tab=shop"><Store size={16} /> Manage my shop</Link></li>}
            <li><button onClick={handleLogout}>Sign out</button></li>
          </ul>
        </div> : <><Link to="/login" className="btn btn-ghost btn-sm rounded-full px-4 normal-case">Log in</Link><Link to="/register" className="btn btn-sm rounded-full border-0 bg-forest px-5 text-white hover:bg-forest/90">Join LocalSphere</Link></>}
      </div>
      <div className="flex items-center gap-1.5 md:hidden">
        <button
          className="btn btn-ghost btn-circle btn-sm"
          onClick={() => setDark(!dark)}
          aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <Link to="/cart" className="btn btn-ghost btn-circle btn-sm relative" aria-label={`Shopping cart, ${itemCount} items`}>
          <ShoppingBag size={18} />
          {itemCount > 0 && <span className="badge badge-sm absolute -right-1 -top-1 border-0 bg-lime text-forest">{itemCount}</span>}
        </Link>
        <button onClick={() => setOpen(!open)} className="btn btn-ghost btn-square btn-sm" aria-label="Toggle navigation">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </div>
    {open && <div className="border-t border-forest/10 bg-cream px-5 py-4 md:hidden">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-forest/10">
          <span className="text-xs font-bold text-forest">Theme Mode</span>
          <button
            onClick={() => setDark(!dark)}
            className="btn btn-xs rounded-full border border-forest/20 bg-white gap-1.5 text-forest"
          >
            {dark ? <><Sun size={13} /> Light mode</> : <><Moon size={13} /> Dark mode</>}
          </button>
        </div>
        {links.map(([label, path]) => (
          <NavLink
            key={path}
            onClick={() => setOpen(false)}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl select-none transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#1b3d30] via-[#244d3d] to-[#2e6e55] text-white font-bold text-sm px-4 py-2.5 shadow-sm dark:from-emerald-700 dark:to-teal-700"
                  : "text-slate-600 dark:text-slate-300 font-medium text-xs px-3.5 py-2 hover:text-forest hover:bg-forest/[0.04]"
              }`
            }
          >
            <span>{label}</span>
          </NavLink>
        ))}
        {user ? <><Link onClick={() => setOpen(false)} to="/dashboard" className="px-3 py-3 font-medium">Dashboard</Link><Link onClick={() => setOpen(false)} to="/messages" className="px-3 py-3 font-medium">Messages</Link><Link onClick={() => setOpen(false)} to="/notifications" className="px-3 py-3 font-medium">Notifications</Link><Link onClick={() => setOpen(false)} to="/cart" className="px-3 py-3 font-medium">Cart ({itemCount})</Link><button className="px-3 py-3 text-left font-medium" onClick={handleLogout}>Sign out</button></> : <Link onClick={() => setOpen(false)} to="/login" className="px-3 py-3 font-medium">Log in / Sign up</Link>}</div>
    </div>}
  </header>;
}
