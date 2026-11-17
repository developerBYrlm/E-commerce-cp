import { Link, useSearchParams } from "react-router-dom";
import { BadgeCheck, Clock3, TriangleAlert } from "lucide-react";

const results = {
  success: {
    icon: BadgeCheck,
    title: "Payment confirmed",
    message: "bKash confirmed your payment. Your order is now with the shop.",
    style: "text-emerald-700",
  },
  cancelled: {
    icon: TriangleAlert,
    title: "Payment cancelled",
    message: "No payment was confirmed. Your reserved items have been released.",
    style: "text-amber-700",
  },
  failed: {
    icon: TriangleAlert,
    title: "Payment not completed",
    message: "bKash did not confirm this payment. You can review your orders or try again.",
    style: "text-red-700",
  },
  review: {
    icon: Clock3,
    title: "Payment needs review",
    message: "We received a payment response that needs verification. Please contact support before placing another order.",
    style: "text-amber-700",
  },
  pending: {
    icon: Clock3,
    title: "Payment is being confirmed",
    message: "bKash has not returned a final result yet. Check your orders again shortly.",
    style: "text-amber-700",
  },
};

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const result = results[params.get("status")] || results.pending;
  const Icon = result.icon;
  return <main className="mx-auto max-w-xl px-5 py-20 text-center">
    <Icon className={`mx-auto ${result.style}`} size={48} />
    <h1 className="mt-5 text-3xl font-extrabold text-forest">{result.title}</h1>
    <p className="mt-3 text-slate-600">{result.message}</p>
    <div className="mt-7 flex justify-center gap-3">
      <Link to="/orders" className="btn rounded-full border-0 bg-forest text-white">View orders</Link>
      {result.title !== "Payment confirmed" && <Link to="/products" className="btn rounded-full border-slate-200 bg-white text-forest">Browse products</Link>}
    </div>
  </main>;
}
