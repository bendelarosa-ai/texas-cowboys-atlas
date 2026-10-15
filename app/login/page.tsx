"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const REMEMBER_KEY = "tc_remembered_name";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [rememberedName, setRememberedName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  // On a device where the member chose "Remember me", greet them by name.
  useEffect(() => {
    try {
      setRememberedName(localStorage.getItem(REMEMBER_KEY));
    } catch {
      /* localStorage unavailable (private mode) — fall back to generic greeting */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Remember (or clear) the member's first name for next time on this device.
    try {
      if (rememberMe && data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_name, display_name")
          .eq("id", data.user.id)
          .single();
        const full = profile?.preferred_name || profile?.display_name || "";
        const first = full.trim().split(/\s+/)[0];
        if (first) localStorage.setItem(REMEMBER_KEY, first);
        else localStorage.removeItem(REMEMBER_KEY);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignore storage/profile errors — they must not block sign-in */
    }

    router.push("/directory");
    router.refresh();
  }

  const lineInput =
    "w-full appearance-none rounded-none border-0 border-b border-stone-300 bg-transparent px-0 py-2 text-stone-900 placeholder-stone-300 focus:border-burnt focus:outline-none focus:ring-0";

  return (
    <div className="fixed inset-0 flex bg-white">
      {/* Left: cannon photo (hidden on small screens) */}
      <div
        className="hidden md:block md:w-1/2 lg:w-[56%] bg-cover bg-center"
        style={{ backgroundImage: "url('/login-cannon.jpg')" }}
      />

      {/* Right: sign-in panel */}
      <div className="flex w-full md:w-1/2 lg:w-[44%] items-center justify-center overflow-y-auto px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Brand mark */}
          <div className="mb-8 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cowboy-logo.webp"
              alt="Texas Cowboys"
              className="h-28 w-auto"
            />
          </div>

          <h1 className="text-center text-4xl font-bold tracking-tight text-stone-900">
            {rememberedName ? `Welcome back, ${rememberedName}!` : "Welcome back, Ben!"}
          </h1>
          <p className="mt-2 mb-8 text-center text-sm text-stone-400">
            Please enter your details
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="login-email" className="block text-xs font-medium text-stone-500 mb-1">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={lineInput}
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="login-password" className="block text-xs font-medium text-stone-500 mb-1">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${lineInput} pr-8`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className="mb-6 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 accent-burnt focus:ring-burnt"
              />
              <span className="text-sm text-stone-600">Remember me</span>
            </label>

            {error && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glass-burnt w-full rounded-full py-3 px-4 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
