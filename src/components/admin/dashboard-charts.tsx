// src/components/admin/dashboard-charts.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Point = { label: string; value: number };

const COLORS = ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8"];

function ChartCard(props: {
  title: string;
  config: any; // shadcn ChartConfig type if you want to import it
  children: React.ReactNode;
}) {
  const { title, config, children } = props;

  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
        </div>

        {/* IMPORTANT: fixed chart area */}
        <div className="mt-3 h-56 w-full">
          <ChartContainer config={config} className="h-full w-full">
            {children as any}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts(props: {
  usersDaily: Point[];
  setsDaily: Point[];
  favoritesDaily: Point[];
  festivalStatus: { name: string; value: number }[];
}) {
  const { usersDaily, setsDaily, festivalStatus } = props;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* USERS */}
      <ChartCard
        title="New users"
        config={{ value: { label: "Users", color: "hsl(var(--chart-1))" } }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={usersDaily} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="value" type="monotone" fillOpacity={0.25} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* SETS */}
      <ChartCard
        title="Sets created"
        config={{ value: { label: "Sets", color: "hsl(var(--chart-2))" } }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={setsDaily} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* FESTIVALS PIE */}
      <ChartCard
        title="Festival status"
        config={{
          Published: { label: "Published", color: COLORS[0] },
          Drafts: { label: "Drafts", color: COLORS[1] },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={festivalStatus}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={4}
            >
              {festivalStatus.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
