import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return <div className="min-h-screen bg-cream text-slate-800 transition-colors duration-200"><Navbar /><main className="min-h-[65vh]"><Outlet /></main><Footer /></div>;
}
