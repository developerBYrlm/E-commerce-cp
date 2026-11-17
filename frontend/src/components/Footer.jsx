import { Link } from "react-router-dom";
import { ArrowUpRight, Compass } from "lucide-react";

export default function Footer() {
  return <footer className="bg-forest text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
      <div><Link to="/" className="inline-flex items-center gap-2 text-xl font-bold"><Compass className="text-lime" /> localsphere</Link><p className="mt-4 max-w-xs text-sm leading-6 text-white/65">Good things are closer than you think. Meet the independent businesses that make your neighborhood.</p></div>
      <div><h3 className="font-bold">Explore</h3><div className="mt-4 flex flex-col gap-3 text-sm text-white/65"><Link to="/shops">Local shops</Link><Link to="/products">Products</Link><Link to="/services">Services</Link><Link to="/feed">Community feed</Link></div></div>
      <div><h3 className="font-bold">Your account</h3><div className="mt-4 flex flex-col gap-3 text-sm text-white/65"><Link to="/register">Join LocalSphere</Link><Link to="/login">Sign in</Link><Link to="/dashboard">Your dashboard</Link></div></div>
      <Link to="/register" className="group flex h-fit items-center justify-between rounded-2xl bg-white/10 p-5 text-sm hover:bg-white/15">Have a local business? <ArrowUpRight className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-5 text-xs text-white/50 sm:flex-row lg:px-8"><span>© {new Date().getFullYear()} LocalSphere. Made for the neighborhood.</span><span>Discover nearby. Support local.</span></div></div>
  </footer>;
}
