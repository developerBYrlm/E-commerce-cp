import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../api/client";
import { useCollection } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "./Loader";

export default function AdminManagement({ resource }) {
  const { user: currentUser } = useAuth();
  const usersMode = resource === "users";
  const path = usersMode ? "/users" : "/shops";
  const query = useCollection(path, { limit: 50 });
  const queryClient = useQueryClient();
  const items = query.data?.items || [];

  async function update(item, changes, message) {
    if (usersMode && item.status === "active" && changes.status === "suspended"
      && !window.confirm(`Suspend ${item.name}'s account? They will lose access until reactivated.`)) return;
    try {
      await api.patch(`${path}/${item._id}${usersMode ? "/status" : ""}`, changes);
      await queryClient.invalidateQueries({ queryKey: [path] });
      toast.success(message);
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (query.isLoading) return <Loader />;
  if (query.isError) return <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{query.error.message}</p>;
  return <section className="rounded-3xl bg-white p-6 shadow-sm">
    <h2 className="mb-5 text-lg font-bold text-forest">{usersMode ? "User accounts" : "Shop verification and moderation"}</h2>
    {!items.length ? <p className="rounded-2xl bg-cream p-6 text-center text-sm text-slate-500">Nothing to manage yet.</p>
      : <div className="divide-y divide-slate-100">
        {items.map((item) => <article key={item._id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime/50 font-bold uppercase text-forest">
            {(item.name || item.email || "L").slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-forest">{item.name}</p>
            <p className="truncate text-xs text-slate-500">{usersMode ? item.email : `${item.address?.city || "Location not set"} · ${item.status}`}</p>
            {usersMode && <p className="mt-1 text-xs capitalize text-slate-500">{item.role} · {item.isVerified ? "verified" : "unverified"}</p>}
          </div>
          {usersMode
            ? <button type="button" disabled={String(item._id) === currentUser.id} onClick={() => update(item, { status: item.status === "active" ? "suspended" : "active" }, `Account ${item.status === "active" ? "suspended" : "reactivated"}`)} className={`btn btn-sm rounded-full ${item.status === "active" ? "btn-outline" : "border-0 bg-forest text-white"}`}>{String(item._id) === currentUser.id ? "Current account" : item.status === "active" ? "Suspend" : "Reactivate"}</button>
            : <div className="flex flex-wrap items-center gap-2">
              {item.status !== "active" && <button type="button" onClick={() => update(item, { status: "active", verified: true }, "Shop approved and verified")} className="btn btn-sm rounded-full border-0 bg-forest text-white">Approve &amp; verify</button>}
              {item.status === "active" && <button type="button" onClick={() => update(item, { status: "suspended" }, "Shop suspended")} className="btn btn-sm rounded-full btn-outline">Suspend</button>}
              {item.status === "suspended" && <button type="button" onClick={() => update(item, { status: "active" }, "Shop reactivated")} className="btn btn-sm rounded-full border-0 bg-forest text-white">Reactivate</button>}
              {item.status === "active" && <button type="button" onClick={() => update(item, { verified: !item.verified }, item.verified ? "Verification removed" : "Shop verified")} className="btn btn-sm rounded-full btn-outline">{item.verified ? "Remove badge" : "Verify"}</button>}
            </div>}
        </article>)}
      </div>}
  </section>;
}
