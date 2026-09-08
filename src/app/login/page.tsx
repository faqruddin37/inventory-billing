"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Wrench, Lock, Mail, User, ShieldCheck, Sparkles, Phone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function checkOwnerStatus() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.data?.authenticated) {
          router.push("/");
          return;
        }
        setIsConfigured(data.data?.isConfigured ?? false);
      } catch {
        setIsConfigured(true); // default to login form
      } finally {
        setIsCheckingSetup(false);
      }
    }

    checkOwnerStatus();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(data.message || "Invalid credentials", "Login Failed");
        return;
      }

      success("Welcome back to your workshop terminal", "Authenticated");
      router.push("/");
      router.refresh();
    } catch {
      showError("Unable to connect to server. Please check your network.", "Connection Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(data.message || "Failed to initialize owner account", "Setup Error");
        return;
      }

      success("Owner account created successfully", "Setup Complete");
      router.push("/");
      router.refresh();
    } catch {
      showError("Unable to connect to server. Please check your network.", "Connection Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Subtle light blue ambient background accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 border border-blue-400/30 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4">
            <Wrench className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-wider">
            AUTO<span className="text-blue-600 font-mono">FLOW</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-heading font-semibold">
            Single-Owner Automotive Terminal
          </p>
        </div>

        {/* Authentication Card */}
        <Card className="border-slate-200 shadow-xl shadow-blue-900/5 bg-white/95 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="justify-center text-xl text-slate-900">
              {isCheckingSetup ? (
                "Initializing System..."
              ) : isConfigured ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-blue-600 inline" /> Owner Authentication
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-blue-600 inline" /> Setup Owner Account
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isCheckingSetup
                ? "Connecting to local service..."
                : isConfigured
                ? "Enter your credentials to access the billing and inventory terminal"
                : "Initial system configuration: Create your master owner account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {isCheckingSetup ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs">Verifying database status...</p>
              </div>
            ) : isConfigured ? (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Owner Email Address"
                  type="email"
                  placeholder="owner@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-blue-600" />}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-blue-600" />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                  isLoading={isLoading}
                >
                  Access Workshop Console
                </Button>
              </form>
            ) : (
              /* Initial Setup Form */
              <form onSubmit={handleSetup} className="space-y-4">
                <Input
                  label="Owner Name"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4 text-blue-600" />}
                />

                <Input
                  label="Owner Email Address"
                  type="email"
                  placeholder="owner@apexautospares.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-blue-600" />}
                />

                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4 text-blue-600" />}
                />

                <Input
                  label="Master Password"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-blue-600" />}
                  helperText="Use a strong password to protect billing & inventory records"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                  isLoading={isLoading}
                >
                  Create Master Owner Account
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* System Security Notice */}
        <div className="mt-6 text-center text-[11px] text-slate-500 font-sans">
          Single-owner authenticated session &bull; Strict server-side GST validation
        </div>
      </div>
    </div>
  );
}
