"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Plus, LogOut, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    loading: boolean;
  }>({
    connected: false,
    loading: true,
  });

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        const json = await res.json();
        setDbStatus({
          connected: json.success && json.data?.database?.connected,
          loading: false,
        });
      } catch {
        setDbStatus({
          connected: false,
          loading: false,
        });
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      {/* Left: Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold font-heading text-slate-900 tracking-wide">
            Automobile Workshop & Spares
          </h1>
          <p className="text-[11px] text-slate-500 font-sans">
            Inventory Management & Invoicing Terminal
          </p>
        </div>
      </div>

      {/* Right: DB Health, Quick Action, Logout */}
      <div className="flex items-center gap-3">
        {/* DB Connection Health Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 border border-slate-200">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline text-slate-500 font-sans">MongoDB:</span>
          {dbStatus.loading ? (
            <span className="text-slate-500 font-sans">Checking...</span>
          ) : dbStatus.connected ? (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold font-sans">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-700 font-medium font-sans">
              <AlertCircle className="w-3 h-3 text-amber-600" /> Offline / Standby
            </span>
          )}
        </div>

        {/* Quick New Invoice Action */}
        <Link href="/billing">
          <Button size="sm" variant="primary" className="hidden sm:inline-flex shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> New Invoice
          </Button>
        </Link>

        {/* Owner Logout Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          title="Sign out of Owner Console"
        >
          <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600 transition-colors" />
          <span className="hidden md:inline ml-1 text-xs text-slate-600">Logout</span>
        </Button>
      </div>
    </header>
  );
}
