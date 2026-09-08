"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SalesChartPoint } from "@/services/dashboard.service";
import { formatINR } from "@/lib/utils/formatters";

interface SalesAreaChartProps {
  data: SalesChartPoint[];
  period: "daily" | "weekly" | "monthly";
}

export function SalesAreaChart({ data, period }: SalesAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-500 border border-dashed border-surface-border rounded-xl">
        No sales data recorded in this period yet.
      </div>
    );
  }

  const formatXAxis = (tick: string) => {
    if (period === "daily") {
      const parts = tick.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    }
    return tick;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gstGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as SalesChartPoint;
                return (
                  <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs font-sans space-y-1">
                    <p className="font-semibold text-slate-900 font-heading">{label}</p>
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <span>Turnover:</span>
                      <span className="font-bold text-blue-600 font-mono">
                        {formatINR(item.sales)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px]">
                      <span>GST Tax:</span>
                      <span className="font-mono font-semibold text-emerald-600">{formatINR(item.gst)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px]">
                      <span>Invoices:</span>
                      <span className="font-mono text-slate-800 font-semibold">{item.invoices} bills</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#2563EB"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#salesGradient)"
            name="Turnover"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
