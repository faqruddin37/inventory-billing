"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils/cn";

export interface PageContainerProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  title,
  description,
  actions,
  children,
  className,
}: PageContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-200">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className={cn("flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6", className)}>
          {(title || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
              <div>
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
