import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, CalendarDays, Flag, MapPin, MessageSquare, PackageCheck, ShoppingBag, Star, Store, Users, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { useCollection } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "../components/Loader";
import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";

export default function DetailPage({ kind }) {
  const { id } = useParams();
  const path = { shops: "/shops", products: "/products", services: "/services" }[kind];
  const query = useCollection(`${path}/${id}`);
  const item = query.data?.item;
  const { user, followShop, followService, toggleWishlist } = useAuth();
  if (query.isLoading) return <div className="mx-auto max-w-7xl px-5 py-16"><Loader /></div>;
  if (query.isError) return <div className="mx-auto max-w-7xl px-5 py-20 text-center text-slate-500">{query.error.message}</div>;
  if (!item) return <div className="mx-auto max-w-7xl px-5 py-20 text-center text-slate-500 font-bold">Resource not found</div>;
  if (kind === "shops") return <ShopDetail shop={item} user={user} followShop={followShop} />;
  return <ItemDetail item={item} kind={kind} user={user} toggleWishlist={toggleWishlist} followService={followService} />;
}

function ShopDetail({ shop, user, followShop }) {
  const navigate = useNavigate();
  const [followersCount, setFollowersCount] = useState(shop.followers?.length || 0);

  async function toggleFollow() {
    if (!user) return toast.error("Sign in as a customer to follow local businesses");
    if (user.role !== "customer") return toast.error("Only customers can follow shops");
    try {
      const res = await followShop(shop._id);
      const isNowFollowing = res?.following ?? res;
      setFollowersCount(res?.followerCount ?? (isNowFollowing ? followersCount + 1 : Math.max(0, followersCount - 1)));
      toast.success(isNowFollowing ? "You’re following this shop" : "Shop unfollowed");
    } catch (error) {
      toast.error(error.message);
    }
  }
  async function reportShop() {
    if (!user) return toast.error("Sign in as a customer to report this business");
    if (user.role !== "customer") return toast.error("Only customers can submit reports");
    const reason = window.prompt("Why should our moderation team review this business? (5–500 characters)");
    if (reason === null) return;
    try {
      await api.post("/reports", { targetType: "Shop", target: shop._id, reason });
      toast.success("Report submitted to our moderation team");
    } catch (error) {
      toast.error(error.message);
    }
  }
  const following = user?.following?.some((id) => String(id) === String(shop._id));
  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-forest shadow-2xs hover:bg-slate-50 transition cursor-pointer"
      >
        ← Back
      </button>
      <div className="h-56 overflow-hidden rounded-[30px] bg-lime/40 sm:h-80">
        {shop.coverImage && <img src={getImageUrl(shop.coverImage)} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-xl font-bold text-forest shadow overflow-hidden">
              {shop.logo ? <img src={getImageUrl(shop.logo)} alt="" className="h-full w-full rounded-2xl object-cover" /> : shop.name?.slice(0, 1)}
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-extrabold text-forest">
                {shop.name}
                {shop.verified && <BadgeCheck className="text-emerald-600" />}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{shop.category?.name || "Local business"}</p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl leading-7 text-slate-600">
            {shop.description || "A local business serving the neighborhood."}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <RelatedList path={`/products?shop=${shop._id}`} title="Browse All Products" count={shop.products?.length} />
            <RelatedList path={`/services?shop=${shop._id}`} title="Browse All Services" count={shop.services?.length} />
          </div>

          {/* Direct Products Preview */}
          {shop.products && shop.products.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-forest flex items-center gap-2">
                  <ShoppingBag size={20} className="text-emerald-700" />
                  Products ({shop.products.length})
                </h2>
                <Link to={`/products?shop=${shop._id}`} className="text-xs font-bold text-emerald-700 hover:underline">
                  View all products →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shop.products.map((prod) => (
                  <Link
                    key={prod._id}
                    to={`/products/${prod._id}`}
                    className="group rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs transition hover:shadow-md hover:border-emerald-300"
                  >
                    <div className="h-36 overflow-hidden rounded-xl bg-slate-100">
                      {prod.images?.[0] ? (
                        <img
                          src={getImageUrl(prod.images[0])}
                          alt={prod.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">🛍️</div>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-bold text-forest text-sm truncate">{prod.name}</h3>
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {formatCurrency(prod.price)}
                        </span>
                        <span className="text-forest font-semibold text-[11px] group-hover:underline">
                          Explore →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Direct Services Preview */}
          {shop.services && shop.services.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-forest flex items-center gap-2">
                  <Wrench size={20} className="text-sky-700" />
                  Services ({shop.services.length})
                </h2>
                <Link to={`/services?shop=${shop._id}`} className="text-xs font-bold text-sky-700 hover:underline">
                  View all services →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shop.services.map((srv) => (
                  <Link
                    key={srv._id}
                    to={`/services/${srv._id}`}
                    className="group rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs transition hover:shadow-md hover:border-sky-300"
                  >
                    <div className="h-36 overflow-hidden rounded-xl bg-slate-100">
                      {srv.images?.[0] ? (
                        <img
                          src={getImageUrl(srv.images[0])}
                          alt={srv.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">🔧</div>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-bold text-forest text-sm truncate">{srv.name}</h3>
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-forest text-sm">
                          {srv.isNegotiable ? (
                            <span className="text-amber-800 font-bold text-xs">Negotiable</span>
                          ) : (
                            formatCurrency(srv.price)
                          )}
                        </span>
                        <span className="text-forest font-semibold text-[11px] group-hover:underline">
                          Book / Explore →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 font-bold text-forest"><MapPin size={17} /> Find us</p>
          <p className="mt-2 text-sm text-slate-600">
            {[shop.extendedAddress, shop.area, shop.subDistrict, shop.district].filter(Boolean).join(", ") || [shop.address?.street, shop.address?.city, shop.address?.region].filter(Boolean).join(", ") || "Ask us for our location"}
          </p>
          {shop.phone && <p className="mt-3 text-sm text-slate-600">{shop.phone}</p>}
          <p className="mt-5 flex items-center gap-2 text-sm text-forest">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            {Number(shop.rating || 0).toFixed(1)} · {shop.reviewCount || 0} reviews
          </p>
          <p className="mt-2.5 flex items-center gap-2 text-sm font-bold text-sky-800">
            <Users size={16} className="text-sky-700" />
            {followersCount} {followersCount === 1 ? "Follower" : "Followers"}
          </p>
          <p className="mt-4 text-xs text-slate-500">Visit us in person or browse what we offer online.</p>
          {(!user || user.role === "customer") && (
            <button onClick={toggleFollow} className="btn mt-5 w-full rounded-xl bg-lime text-forest">
              {following ? "Following · Unfollow" : "Follow this shop"}
            </button>
          )}
          {(!user || user.role === "customer") && shop.owner?._id && String(shop.owner._id) !== user?.id && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  toast("Please log in to message the shop owner", { icon: "🔒" });
                  navigate(`/login?redirect=${encodeURIComponent(`/messages?with=${shop.owner._id}`)}`);
                  return;
                }
                navigate(`/messages?with=${shop.owner._id}`);
              }}
              className="btn mt-3 w-full rounded-xl border-0 bg-forest text-white"
            >
              Message this business
            </button>
          )}
          {user?.role === "customer" && (
            <button onClick={reportShop} className="btn btn-ghost mt-3 w-full rounded-xl text-slate-500">
              <Flag size={15} /> Report business
            </button>
          )}
        </aside>

        <div className="lg:col-span-2">
          <ReviewPanel shopId={shop._id} user={user} />
        </div>
      </div>
    </div>
  );
}

function RelatedList({ path, title, count }) {
  return (
    <Link to={path} className="group rounded-2xl bg-white p-5 text-sm font-bold text-forest shadow-sm hover:shadow-md transition border border-slate-100 flex items-center justify-between">
      <div>
        <span>{title}</span>
        {count !== undefined && <span className="ml-2 text-xs text-slate-400 font-normal">({count})</span>}
        <span className="mt-1 block text-xs font-normal text-slate-500 group-hover:text-emerald-700">Explore listings →</span>
      </div>
      <Store size={18} className="text-slate-300 group-hover:text-forest transition" />
    </Link>
  );
}

function ItemDetail({ item, kind, user, toggleWishlist, followService }) {
  const [activeImage, setActiveImage] = useState(0);
  const [scheduledAt, setScheduledAt] = useState("");
  const [followersCount, setFollowersCount] = useState(item.followers?.length || 0);
  const { addItem } = useCart();
  async function act(endpoint, body, message) {
    if (!user) return toast.error("Please sign in to continue");
    try { await api.post(endpoint, body); toast.success(message); }
    catch (error) { toast.error(error.message); }
  }
  async function saveProduct() {
    if (!user) return toast.error("Please sign in to save products");
    try {
      const saved = await toggleWishlist(item._id);
      toast.success(saved ? "Saved to your wishlist" : "Removed from your wishlist");
    } catch (error) {
      toast.error(error.message);
    }
  }
  async function reportItem() {
    if (!user) return toast.error(`Sign in as a customer to report this ${kind === "products" ? "product" : "service"}`);
    if (user.role !== "customer") return toast.error("Only customers can submit reports");
    const reason = window.prompt(`Why should our moderation team review this ${kind === "products" ? "product" : "service"}? (5–500 characters)`);
    if (reason === null) return;
    try {
      await api.post("/reports", { targetType: kind === "products" ? "Product" : "Service", target: item._id, reason });
      toast.success("Report submitted to our moderation team");
    } catch (error) {
      toast.error(error.message);
    }
  }
  const navigate = useNavigate();

  const isFollowingService = user?.followingServices?.some((id) => String(id) === String(item._id));

  async function toggleFollowService() {
    if (!user) return toast.error("Sign in as a customer to follow services");
    if (user.role !== "customer") return toast.error("Only customers can follow services");
    try {
      const res = await followService(item._id);
      const isNowFollowing = res?.following ?? res;
      setFollowersCount(res?.followerCount ?? (isNowFollowing ? followersCount + 1 : Math.max(0, followersCount - 1)));
      toast.success(isNowFollowing ? "You’re following this service" : "Service unfollowed");
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleMessageClick() {
    const ownerId = item.owner?._id || item.owner || item.shop?.owner?._id || item.shop?.owner;
    if (!ownerId) {
      toast.error("Owner information unavailable for this listing");
      return;
    }
    if (!user) {
      toast("Please log in to message the shop owner", { icon: "🔒" });
      navigate(`/login?redirect=${encodeURIComponent(`/messages?with=${ownerId}`)}`);
      return;
    }
    if (String(user.id || user._id) === String(ownerId)) {
      toast.error("You own this listing");
      return;
    }
    if (user.role === "owner") {
      toast.error("Shop owners cannot message other shop owners");
      return;
    }
    navigate(`/messages?with=${ownerId}`);
  }

  const images = item.images || [];
  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-forest shadow-2xs hover:bg-slate-50 transition cursor-pointer"
      >
        ← Back
      </button>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-lime/40 to-emerald-100">
            {images[activeImage] || images[0] ? (
              <img src={getImageUrl(images[activeImage] || images[0])} alt={item.name} className="h-[420px] w-full object-cover" />
            ) : (
              <div className="grid h-[420px] place-items-center"><Store size={48} className="text-forest" /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${activeImage === idx ? "border-forest scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="py-3"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">{item.shop?.name || "LocalSphere independent"}</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest">{item.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold text-forest">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              {Number(item.rating || 0).toFixed(1)} ({item.reviewCount || 0} reviews)
            </span>
            {kind === "products" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                🔥 {item.soldCount || 0} sold
              </span>
            )}
            {kind === "services" && (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  ⭐ {item.bookingCount || 0} booked
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-bold text-sky-900">
                  <Users size={12} className="text-sky-700" /> {followersCount} {followersCount === 1 ? "follower" : "followers"}
                </span>
              </>
            )}
          </div><p className="mt-6 leading-7 text-slate-600">{item.description || "Thoughtfully offered by a local business."}</p><p className="mt-7 flex flex-wrap items-center gap-2 text-3xl font-extrabold text-forest">
            {item.isNegotiable && (!item.price || item.price === 0) ? "Negotiable" : formatCurrency(item.price)}
            {item.isNegotiable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                🤝 Negotiable (আলোচনা সাপেক্ষ)
              </span>
            )}
            {kind === "services" && !item.isNegotiable && <span className="text-sm font-medium text-slate-500">per session</span>}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {kind === "products" ? (
              <>
                <button
                  onClick={() => {
                    if (!user) return toast.error("Please sign in to add products to your cart");
                    addItem(item);
                    toast.success("Added to your cart");
                  }}
                  className="btn rounded-xl border-0 bg-forest px-6 text-white"
                >
                  <ShoppingBag size={17} /> Add to cart
                </button>
                <button onClick={saveProduct} className="btn rounded-xl bg-lime px-5 text-forest">
                  {user?.wishlist?.some((id) => String(id) === String(item._id)) ? "Saved · Remove" : "Save for later"}
                </button>
                <span className="self-center text-xs text-slate-500">{item.stock} in stock</span>
                {user?.role === "customer" && (
                  <button type="button" onClick={reportItem} className="btn btn-ghost text-slate-500">
                    <Flag size={15} /> Report
                  </button>
                )}
              </>
            ) : (
              <>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  className="input input-bordered rounded-xl bg-white"
                  aria-label="Appointment date and time"
                />
                <button
                  onClick={() =>
                    act(
                      "/bookings",
                      { service: item._id, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : "" },
                      "Booking request sent"
                    )
                  }
                  disabled={!scheduledAt}
                  className="btn rounded-xl border-0 bg-forest px-6 text-white"
                >
                  <CalendarDays size={17} /> Request a booking
                </button>
                {(!user || user.role === "customer") && (
                  <button
                    type="button"
                    onClick={toggleFollowService}
                    className="btn rounded-xl bg-lime px-5 text-forest"
                  >
                    {isFollowingService ? "Following · Unfollow" : "Follow service"}
                  </button>
                )}
                {user?.role === "customer" && (
                  <button type="button" onClick={reportItem} className="btn btn-ghost text-slate-500">
                    <Flag size={15} /> Report
                  </button>
                )}
              </>
            )}

            {(!user || user.role === "customer") && (
              <button
                type="button"
                onClick={handleMessageClick}
                className="btn rounded-xl border border-forest/15 bg-cream/70 px-5 font-semibold text-forest shadow-xs transition hover:bg-forest hover:text-white"
              >
                <MessageSquare size={17} />
                {kind === "products" ? "Message seller" : "Message expert"}
              </button>
            )}
          </div>
          {item.shop?._id && <div className="mt-10 border-t border-slate-200 pt-6"><p className="flex items-center gap-2 text-sm font-bold text-forest"><PackageCheck size={16} /> From a neighborhood business</p><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin size={15} />Visit in person or browse online</p></div>}
          {item.shop?._id && <div className="mt-8"><ReviewPanel shopId={item.shop._id} target={{ [kind === "products" ? "product" : "service"]: item._id }} user={user} /></div>}
        </div>
      </div>
    </div>
  );
}

function ReviewPanel({ shopId, target = {}, user }) {
  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  const filters = { shop: shopId, ...target };
  const reviews = useCollection("/reviews", filters);
  async function submit(event) {
    event.preventDefault();
    if (!user) return toast.error("Sign in to leave a review");
    try {
      await api.post("/reviews", { ...filters, rating: Number(rating), text: text.trim() });
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["/reviews"] });
      toast.success("Thanks for sharing your review");
    } catch (error) {
      toast.error(error.message);
    }
  }
  return <section className="rounded-3xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-forest">Reviews</h2>
    {reviews.isLoading ? <p className="mt-4 text-sm text-slate-500">Loading reviews…</p>
      : reviews.isError ? <p role="alert" className="mt-4 text-sm text-red-600">{reviews.error.message}</p>
        : reviews.data?.items?.length ? <div className="mt-4 divide-y divide-slate-100">{reviews.data.items.map((review) => <article key={review._id} className="py-4 first:pt-0"><p className="font-semibold text-forest">{review.author?.name || "LocalSphere member"} · {review.rating}/5</p><p className="mt-1 text-sm leading-6 text-slate-600">{review.text || "No written comment."}</p></article>)}</div>
          : <p className="mt-3 text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>}
    {user && <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[130px_1fr_auto]">
      <label className="form-control gap-1 text-xs font-semibold text-forest">Rating<select value={rating} onChange={(event) => setRating(event.target.value)} className="select select-bordered rounded-xl"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>
      <label className="form-control gap-1 text-xs font-semibold text-forest">Your review<textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={2} className="textarea textarea-bordered rounded-xl" placeholder="Share helpful details for your neighbors." /></label>
      <button className="btn self-end rounded-xl border-0 bg-forest text-white">Post review</button>
    </form>}
  </section>;
}
