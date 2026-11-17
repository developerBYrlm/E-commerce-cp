import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Bell, CalendarDays, MessageCircle, PackageCheck, Star } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "../components/Loader";

const icons = { order: PackageCheck, booking: CalendarDays, message: MessageCircle, review: Star, system: Bell };

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["/notifications", {}];
  const query = useQuery({
    queryKey,
    queryFn: async () => (await api.get("/notifications")).data,
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, { withCredentials: true });
    socket.on("notification:new", () => queryClient.invalidateQueries({ queryKey: ["/notifications"] }));
    socket.on("connect_error", (error) => console.error("Realtime notifications are unavailable:", error.message));
    return () => socket.disconnect();
  }, [queryClient, user.id]);

  async function markRead(item) {
    if (item.readAt) return;
    try {
      await api.patch(`/notifications/${item._id}/read`);
      await queryClient.invalidateQueries({ queryKey: ["/notifications"] });
    } catch (error) {
      toast.error(error.message);
    }
  }

  const items = query.data?.items || [];
  const unread = items.filter((item) => !item.readAt).length;
  return <main className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Your LocalSphere</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold text-forest">Notifications</h1><p className="mt-2 text-sm text-slate-500">Updates about orders, bookings, messages, and reviews.</p></div>{unread > 0 && <span className="badge border-0 bg-lime px-3 py-3 text-forest">{unread} unread</span>}</div>
    {query.isLoading ? <div className="mt-7"><Loader /></div> : query.isError ? <p role="alert" className="mt-7 rounded-2xl bg-red-50 p-5 text-sm text-red-700">{query.error.message}</p> : items.length ? <div className="mt-7 divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm">{items.map((item) => {
      const Icon = icons[item.type] || Bell;
      const href = item.type === "order" ? "/orders" : item.type === "booking" ? "/bookings" : item.type === "message" ? "/messages" : "/dashboard";
      return <Link key={item._id} to={href} onClick={() => markRead(item)} className={`flex gap-4 p-5 transition hover:bg-cream ${item.readAt ? "" : "bg-emerald-50/60"}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime/50 text-forest"><Icon size={19} /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-semibold text-forest">{item.title}{!item.readAt && <span className="h-2 w-2 rounded-full bg-emerald-600" />}</span><span className="mt-1 block text-sm text-slate-600">{item.body || "You have a new LocalSphere update."}</span><time className="mt-2 block text-xs text-slate-400" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></span>
      </Link>;
    })}</div> : <div className="mt-7 rounded-3xl bg-white p-12 text-center shadow-sm"><Bell className="mx-auto text-emerald-700" /><h2 className="mt-3 font-bold text-forest">You’re all caught up</h2><p className="mt-2 text-sm text-slate-500">New updates will appear here.</p></div>}
  </main>;
}
