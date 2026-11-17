import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, Truck, Store, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";

const DELIVERY_ZONES = [
  { id: "inside_dhaka", label: "ঢাকা মেট্রো (Inside Dhaka)", charge: 70, desc: "ঢাকার অভ্যন্তরীণ সকল থানা" },
  { id: "dhaka_suburbs", label: "ঢাকার কাছাকাছি (Suburbs)", charge: 100, desc: "সাভার, কেরানীগঞ্জ, গাজীপুর, নারায়ণগঞ্জ ইত্যাদি" },
  { id: "outside_dhaka", label: "ঢাকার বাইরে (Outside Dhaka)", charge: 150, desc: "সারা বাংলাদেশ জেলা ও উপজেলা" },
];

export default function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, setQuantity, removeItem, clearCart } = useCart();
  const [fulfillment, setFulfillment] = useState("delivery");
  const [deliveryZone, setDeliveryZone] = useState("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [district, setDistrict] = useState("Dhaka");
  const [subDistrict, setSubDistrict] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      if (user.phone && !phone) setPhone(user.phone);
      if (user.district) {
        setDistrict(user.district);
        setCity(user.district);
      }
      if (user.subDistrict) setSubDistrict(user.subDistrict);
      if (user.area) setArea(user.area);
      if (user.address && !street) setStreet(user.address);
    }
  }, [user]);

  const deliveryCharge = fulfillment === "delivery"
    ? (DELIVERY_ZONES.find((z) => z.id === deliveryZone)?.charge ?? 70)
    : 0;
  const grandTotal = subtotal + deliveryCharge;

  async function checkout(event) {
    event.preventDefault();
    if (!user) return navigate("/login?redirect=/cart");
    if (!items.length || busy) return;
      if (fulfillment === "delivery" && (!street.trim() || (!city.trim() && !district.trim()))) {
        return toast.error("Enter your delivery address and district/city");
      }
      setBusy(true);
      try {
        const body = {
          items: items.map((line) => ({ product: line.product._id, quantity: line.quantity })),
          fulfillment,
          paymentMethod,
          ...(fulfillment === "delivery" ? {
            deliveryZone,
            deliveryCharge,
            deliveryAddress: {
              street: street.trim(),
              city: (city.trim() || district.trim() || "Dhaka"),
              district: (district.trim() || city.trim() || "Dhaka"),
              subDistrict: subDistrict.trim(),
              area: area.trim(),
              phone: phone.trim() || user?.phone || "",
            },
          } : {}),
        };
        const { data } = await api.post("/orders", body);
        if (data.redirectUrl) {
          clearCart();
          window.location.assign(data.redirectUrl);
          return;
        }
        clearCart();
        await queryClient.invalidateQueries({ queryKey: ["/orders"] });
        toast.success(data.message || "Order placed successfully!");
        navigate("/dashboard");
      } catch (error) {
        toast.error(error.message);
      } finally {
        setBusy(false);
      }
    }

    if (!items.length) {
      return <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-lime/50 text-forest"><ShoppingBag /></span>
        <h1 className="mt-5 text-3xl font-extrabold text-forest">Your cart is ready for a local find.</h1>
        <p className="mt-2 text-slate-500">Add products from neighborhood shops and come back here to check out.</p>
        <Link to="/products" className="btn mt-6 rounded-full border-0 bg-forest text-white">Browse products</Link>
      </section>;
    }

    const shopIds = new Set(items.map((line) => line.product.shop?._id || line.product.shop));
      return <main className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_390px] lg:px-8">
        <section>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Your neighborhood basket</p>
          <h1 className="mt-2 text-3xl font-extrabold text-forest">Shopping cart</h1>
          {shopIds.size > 1 && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Checkout is limited to one shop per order. Remove items from other shops to continue.</p>}
          <div className="mt-6 divide-y divide-slate-100 rounded-3xl bg-white px-5 shadow-sm">
            {items.map(({ product, quantity }) => <article key={product._id} className="flex flex-wrap items-center gap-4 py-5">
              {product.images?.[0]
                ? <img src={getImageUrl(product.images[0])} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                : <span className="grid h-20 w-20 place-items-center rounded-2xl bg-lime/40 text-forest"><ShoppingBag /></span>}
              <div className="min-w-0 flex-1">
                <Link to={`/products/${product._id}`} className="font-bold text-forest">{product.name}</Link>
                <p className="mt-1 text-sm text-slate-500">{product.shop?.name || "Local shop"}</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(product.price * (1 - (product.discount || 0) / 100))}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => setQuantity(product._id, quantity - 1)} className="btn btn-circle btn-sm"><Minus size={14} /></button>
                <span className="w-6 text-center">{quantity}</span>
                <button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => setQuantity(product._id, quantity + 1)} disabled={quantity >= 100} className="btn btn-circle btn-sm"><Plus size={14} /></button>
                <button type="button" onClick={() => removeItem(product._id)} aria-label={`Remove ${product.name}`} className="btn btn-ghost btn-circle btn-sm text-red-600"><Trash2 size={16} /></button>
              </div>
            </article>)}
          </div>
        </section>
        <form onSubmit={checkout} className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-forest">Order Checkout</h2>

            {/* Price Summary */}
            <div className="mt-4 space-y-2 border-b border-slate-100 pb-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Products subtotal</span>
                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              {fulfillment === "delivery" && (
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1"><Truck size={14} className="text-forest" /> Delivery charge</span>
                  <span className="font-bold text-emerald-700">+{formatCurrency(deliveryCharge)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-base font-extrabold text-forest">
                <span>Total Payable</span>
                <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Fulfillment Selection */}
            <fieldset className="mt-5 space-y-2">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Fulfillment Method</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${fulfillment === "delivery" ? "border-forest bg-forest/5 text-forest" : "border-slate-200 bg-white text-slate-700"}`}>
                  <input type="radio" name="fulfillment" value="delivery" checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} className="radio radio-xs radio-success" />
                  <Truck size={15} /> Delivery
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${fulfillment === "pickup" ? "border-forest bg-forest/5 text-forest" : "border-slate-200 bg-white text-slate-700"}`}>
                  <input type="radio" name="fulfillment" value="pickup" checked={fulfillment === "pickup"} onChange={() => setFulfillment("pickup")} className="radio radio-xs radio-success" />
                  <Store size={15} /> Shop Pickup
                </label>
              </div>
            </fieldset>

              {/* Delivery Zone Options */}
              {fulfillment === "delivery" && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Zone & Rate (ডেলিভারি এরিয়া)</p>
                  <div className="space-y-2">
                    {DELIVERY_ZONES.map((zone) => (
                      <label
                        key={zone.id}
                        className={`flex cursor-pointer items-start justify-between rounded-2xl border p-3 text-xs transition ${deliveryZone === zone.id ? "border-emerald-600 bg-emerald-50/50" : "border-slate-200 bg-white"
                          }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="deliveryZone"
                            value={zone.id}
                            checked={deliveryZone === zone.id}
                            onChange={() => setDeliveryZone(zone.id)}
                            className="radio radio-xs radio-success mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-forest">{zone.label}</span>
                            <p className="text-[11px] text-slate-500">{zone.desc}</p>
                          </div>
                        </div>
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                          {formatCurrency(zone.charge)}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Delivery Address Form */}
                  <div className="mt-3 space-y-2.5 rounded-2xl bg-slate-50/70 p-3.5 border border-slate-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-forest flex items-center gap-1">
                      <MapPin size={12} /> Delivery Destination Details
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        value={district}
                        onChange={(event) => { setDistrict(event.target.value); setCity(event.target.value); }}
                        maxLength={100}
                        placeholder="District (e.g. Dhaka)"
                        className="input input-bordered input-sm rounded-xl bg-white text-xs"
                      />
                      <input
                        value={subDistrict}
                        onChange={(event) => setSubDistrict(event.target.value)}
                        maxLength={100}
                        placeholder="Upazila / Thana (e.g. Mirpur)"
                        className="input input-bordered input-sm rounded-xl bg-white text-xs"
                      />
                    </div>
                    <input
                      value={area}
                      onChange={(event) => setArea(event.target.value)}
                      maxLength={150}
                      placeholder="Area / Neighborhood / Elaka (e.g. Section-10)"
                      className="input input-bordered input-sm w-full rounded-xl bg-white text-xs"
                    />
                    <input
                      required
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      maxLength={200}
                      placeholder="Street / House & Road Address *"
                      className="input input-bordered input-sm w-full rounded-xl bg-white text-xs"
                    />
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        maxLength={20}
                        placeholder="Delivery Contact Phone (01...)"
                        className="input input-bordered input-sm w-full pl-8 rounded-xl bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Selection */}
              <div className="mt-5 rounded-2xl bg-cream/70 p-4 border border-amber-100">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-forest">Payment method</p>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="radio radio-xs radio-success" />
                  <span className="font-semibold text-slate-800">Cash on delivery or pickup</span>
                </label>
                <label className="mt-2.5 flex items-center gap-2 text-xs cursor-pointer">
                  <input type="radio" name="payment" value="bkash" checked={paymentMethod === "bkash"} onChange={() => setPaymentMethod("bkash")} className="radio radio-xs radio-success" />
                  <span className="font-semibold text-slate-800">Pay securely with bKash</span>
                </label>
              </div>

                <button type="submit" disabled={busy || shopIds.size > 1} className="btn mt-5 w-full rounded-xl border-0 bg-forest text-white hover:bg-forest/90">
                  {busy ? <span className="loading loading-spinner loading-sm" /> : paymentMethod === "bkash" ? `Pay with bKash · ${formatCurrency(grandTotal)}` : `Place Order · ${formatCurrency(grandTotal)}`}
                </button>
              </form>
            </main>;
}
