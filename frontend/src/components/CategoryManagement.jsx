import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../api/client";
import { useCollection } from "../hooks/useApi";
import { Loader } from "./Loader";

export default function CategoryManagement() {
  const query = useCollection("/categories", { limit: 100 });
  const queryClient = useQueryClient();

  async function createCategory(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const slug = name.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return toast.error("Enter a category name with letters or numbers");
    try {
      await api.post("/categories", { name, slug, type: data.get("type"), description: data.get("description") });
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["/categories"] });
      toast.success("Category created");
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (query.isLoading) return <Loader />;
  if (query.isError) return <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{query.error.message}</p>;
  const categories = query.data?.items || [];
  return <section className="space-y-5">
    <div className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="font-bold text-forest">Platform categories</h2><p className="mt-1 text-sm text-slate-500">Categories are shared by discovery, shops, products, and services.</p>
      {categories.length ? <div className="mt-5 flex flex-wrap gap-2">{categories.map((category) => <span key={category._id} className="badge h-auto gap-2 border-0 bg-cream px-3 py-3 text-forest"><strong>{category.name}</strong><span className="text-slate-500">{category.type}</span></span>)}</div> : <p className="mt-5 text-sm text-slate-500">No categories have been created yet.</p>}
    </div>
    <form onSubmit={createCategory} className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="font-bold text-forest">Add a category</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="form-control gap-2"><span className="text-xs font-semibold text-forest">Name</span><input name="name" required maxLength={80} className="input input-bordered rounded-xl bg-cream" /></label>
      <label className="form-control gap-2"><span className="text-xs font-semibold text-forest">Applies to</span><select name="type" className="select select-bordered rounded-xl bg-cream"><option value="all">All</option><option value="shop">Shops</option><option value="product">Products</option><option value="service">Services</option></select></label>
      <label className="form-control gap-2 sm:col-span-2"><span className="text-xs font-semibold text-forest">Description (optional)</span><input name="description" maxLength={500} className="input input-bordered rounded-xl bg-cream" /></label>
    </div><button className="btn mt-5 rounded-full border-0 bg-forest text-white">Create category</button></form>
  </section>;
}
