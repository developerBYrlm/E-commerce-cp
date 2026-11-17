import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Compass, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useApi";
import LocationFields from "../components/LocationFields";

export default function AuthPage({ mode = "login" }) {
  const { login, googleLogin, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [location, setLocation] = useState({});
  const [shopCategories, setShopCategories] = useState([]);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectTarget = params.get("redirect") === "/cart" ? "/cart" : "/dashboard";
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: { role: params.get("role") === "owner" ? "owner" : "customer" },
  });
  const selectedRole = useWatch({ control, name: "role" });
  const categoryQuery = useCollection("/categories", { limit: 100 });
  const resetMode = mode === "forgot" || mode === "reset";
  const registerMode = mode === "register";

  useEffect(() => {
    if (mode !== "login" || !googleClientId || !googleButtonRef.current) return undefined;
    let disposed = false;
    const renderGoogleButton = () => {
      if (disposed || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setBusy(true);
          try {
            await googleLogin({ credential });
            toast.success("Welcome to LocalSphere!");
            navigate(redirectTarget, { replace: true });
          } catch (error) {
            toast.error(error.message);
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline", size: "large", shape: "pill", width: 360,
      });
    };
    let script = document.querySelector('script[data-google-identity="true"]');
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderGoogleButton);
      script.addEventListener("error", () => toast.error("Google sign-in could not be loaded"));
    }
    return () => {
      disposed = true;
      script?.removeEventListener("load", renderGoogleButton);
    };
  }, [googleClientId, googleLogin, mode, navigate, redirectTarget]);

  async function onSubmit(values) {
    setBusy(true);
    try {
      if (mode === "login") {
        const user = await login(values);
        toast.success("Welcome back!");
        navigate(redirectTarget, { replace: true });
      } else if (registerMode) {
        if (!location.district || !location.subDistrict || !location.area?.trim()) throw new Error("Choose your district, sub-district, and area");
        if (selectedRole === "owner" && (!shopCategories.length || shopCategories.length > 10)) throw new Error("Choose between 1 and 10 business categories");
        await createAccount({ ...values, ...location, shopCategories });
        toast.success("Your LocalSphere account is ready");
        navigate("/dashboard");
      } else if (mode === "forgot") {
        const { data } = await api.post("/auth/forgot-password", values);
        setNotice(data.message);
      } else if (mode === "reset") {
        const token = params.get("token");
        if (!token) throw new Error("Reset link is missing its token");
        const { data } = await api.post("/auth/reset-password", { token, password: values.password });
        setNotice(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally { setBusy(false); }
  }

  return <div className="mx-auto grid min-h-[75vh] max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:px-8">
    <div className="hidden overflow-hidden rounded-[32px] bg-forest p-10 text-white lg:block">
      <Link to="/" className="inline-flex items-center gap-2 font-bold"><Compass className="text-lime" /> localsphere</Link>
      <div className="mt-20 max-w-lg"><p className="text-xs font-bold uppercase tracking-[.2em] text-lime">Good things are closer</p><h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight">{registerMode ? "Your next chapter is just around the corner." : "Your neighborhood, right where you left it."}</h1><p className="mt-5 leading-7 text-white/65">Meet the people, places, and independent businesses that make your local community feel like home.</p></div>
      <div className="mt-16 rounded-2xl bg-white/10 p-5"><p className="text-sm leading-6 text-white/85">“Found my new favorite bakery and booked a bike tune-up in one afternoon. Love having the neighborhood in one place.”</p><p className="mt-3 text-xs font-semibold text-lime">— Maya, LocalSphere neighbor</p></div>
    </div>
    <div className="mx-auto w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16} /> Back to LocalSphere</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-emerald-700">{resetMode ? "Account help" : registerMode ? "Join the neighborhood" : "Welcome back"}</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-forest">{mode === "login" ? "Good to see you." : mode === "register" ? "Find your kind of local." : mode === "forgot" ? "Forgot your password?" : "Choose a new password"}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{mode === "login" ? "Sign in to pick up where you left off." : mode === "register" ? "Create an account and get to know your neighborhood." : "We'll help you get back into your account."}</p>
      {notice ? <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}{mode === "reset" && <Link to="/login" className="mt-3 flex items-center gap-1 font-bold">Sign in <ArrowRight size={14} /></Link>}</div> : <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        {registerMode && <><label className="form-control gap-2"><span className="text-sm font-semibold text-forest">Your name</span><input className="input input-bordered w-full rounded-xl bg-white" placeholder="Alex Morgan" {...register("name", { required: "Please enter your name", minLength: { value: 2, message: "Name must be at least 2 characters" } })} />{errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}</label>
          <label className="form-control gap-2"><span className="text-sm font-semibold text-forest">I’m here as a</span><select className="select select-bordered w-full rounded-xl bg-white" {...register("role")}><option value="customer">Neighbor — discover local businesses</option><option value="owner">Business owner — grow my local business</option></select></label>
          <label className="form-control gap-2"><span className="text-sm font-semibold text-forest">Phone number{selectedRole === "owner" ? " (required)" : ""}</span><input required={selectedRole === "owner"} className="input input-bordered w-full rounded-xl bg-white" maxLength={30} placeholder="+880…" {...register("phone")} /></label>
          <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="mb-3 text-sm font-bold text-forest">Your Bangladesh location</p><LocationFields value={location} onChange={setLocation} addressRequired={selectedRole === "owner"} /></div>
          {selectedRole === "owner" && <fieldset className="rounded-2xl border border-slate-100 bg-white p-4"><legend className="px-1 text-sm font-bold text-forest">Business categories (choose at least one)</legend>{categoryQuery.isLoading ? <p className="text-xs text-slate-500">Loading categories…</p> : categoryQuery.isError ? <p role="alert" className="text-xs text-red-700">{categoryQuery.error.message}</p> : <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto">{(categoryQuery.data?.items || []).filter((item) => ["shop", "all"].includes(item.type)).map((category) => <label key={category._id} className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="checkbox checkbox-sm checkbox-success" checked={shopCategories.includes(category._id)} onChange={(event) => setShopCategories((current) => event.target.checked ? [...current, category._id] : current.filter((id) => id !== category._id))} />{category.name}</label>)}</div>}{shopCategories.length > 10 && <p className="mt-2 text-xs text-red-600">Select no more than 10 categories.</p>}</fieldset>}</>}
        {(mode === "login" || registerMode || mode === "forgot") && <label className="form-control gap-2"><span className="text-sm font-semibold text-forest">Email address</span><input type="email" className="input input-bordered w-full rounded-xl bg-white" placeholder="you@example.com" {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} />{errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}</label>}
        {(mode === "login" || registerMode || mode === "reset") && <label className="form-control gap-2"><span className="text-sm font-semibold text-forest">Password</span><span className="relative"><input type={showPassword ? "text" : "password"} className="input input-bordered w-full rounded-xl bg-white pr-12" placeholder={registerMode || mode === "reset" ? "At least 10 characters" : "Your password"} {...register("password", { required: "Password is required", minLength: { value: 10, message: "Password must be at least 10 characters" } })} /><button type="button" className="absolute right-3 top-3 text-slate-400" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>{errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}</label>}
        {mode === "login" && <div className="text-right"><Link to="/forgot-password" className="text-xs font-semibold text-emerald-700">Forgot password?</Link></div>}
        <button disabled={busy} className="btn w-full rounded-xl border-0 bg-forest text-white hover:bg-forest/90">{busy ? <span className="loading loading-spinner loading-sm" /> : <>{mode === "login" ? "Sign in" : mode === "register" ? "Create your account" : mode === "forgot" ? "Send reset instructions" : "Update password"}<ArrowRight size={17} /></>}</button>
      </form>}
      {mode === "login" && <div className="mt-5">
        {googleClientId
          ? <div ref={googleButtonRef} className="flex min-h-10 justify-center" />
          : <p className="text-center text-xs text-slate-400">Google sign-in is available after setting VITE_GOOGLE_CLIENT_ID.</p>}
      </div>}
      <p className="mt-6 text-center text-sm text-slate-500">{mode === "login" ? <>New to LocalSphere? <Link to="/register" className="font-bold text-forest">Create an account</Link></> : mode === "register" ? <>Already have an account? <Link to="/login" className="font-bold text-forest">Sign in</Link></> : mode === "forgot" ? <Link to="/login" className="font-bold text-forest">Back to sign in</Link> : null}</p>
    </div>
  </div>;
}
