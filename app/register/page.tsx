"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: "hsl(var(--muted) / 0.15)" }}>
      <div style={{ width: 380, padding: 40, background: "hsl(var(--card))", borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2 mb-6">
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "hsl(var(--success))", display: "grid", placeItems: "center" }}>
            <UserPlus size={16} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Create your account</h1>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 6, background: "hsl(var(--error) / 0.1)", color: "hsl(var(--error))", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Full name</label>
            <input
              type="text"
              className="ref-input"
              placeholder="Jane Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Work email</label>
            <input
              type="email"
              className="ref-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="ref-input"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Confirm password</label>
            <input
              type="password"
              className="ref-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="ref-btn primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="text-center mt-5" style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline" style={{ fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
