import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return <div className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-5 text-center"><span className="grid h-16 w-16 place-items-center rounded-3xl bg-lime text-forest"><Compass size={32} /></span><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-emerald-700">A little off the map</p><h1 className="mt-2 text-5xl font-black tracking-tight text-forest">404</h1><p className="mt-3 text-slate-500">We couldn't find that page. Let's get you back to the good stuff nearby.</p><Link to="/" className="btn mt-7 rounded-full border-0 bg-forest text-white"><ArrowLeft size={16} /> Back home</Link></div>;
}
