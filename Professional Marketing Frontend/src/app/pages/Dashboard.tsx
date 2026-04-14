import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, TrendingUp, MessageSquare, Target, ArrowUpRight, Sparkles, Store } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchDashboard } from "../lib/api";

const statMeta = [
  { title: "Leads generes", icon: Users, color: "from-blue-500 to-blue-600" },
  { title: "Taux de connexion", icon: Target, color: "from-indigo-500 to-indigo-600" },
  { title: "Posts publies", icon: MessageSquare, color: "from-purple-500 to-purple-600" },
  { title: "Messages termines", icon: TrendingUp, color: "from-pink-500 to-pink-600" },
];

const emptyWeekly = [
  { day: "Lun", leads: 0, engagement: 0 },
  { day: "Mar", leads: 0, engagement: 0 },
  { day: "Mer", leads: 0, engagement: 0 },
  { day: "Jeu", leads: 0, engagement: 0 },
  { day: "Ven", leads: 0, engagement: 0 },
  { day: "Sam", leads: 0, engagement: 0 },
  { day: "Dim", leads: 0, engagement: 0 },
];

export function Dashboard() {
  const [stats, setStats] = useState<{ title: string; value: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState(emptyWeekly);
  const [recentLeads, setRecentLeads] = useState<{ name: string; title: string; status: string }[]>([]);

  useEffect(() => {
    let active = true;
    fetchDashboard()
      .then((response) => {
        if (!active) return;
        setStats(response.stats);
        setWeeklyData(response.weekly?.length ? response.weekly : emptyWeekly);
        setRecentLeads(response.recent_leads);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const cards = statMeta.map((meta) => ({
    ...meta,
    value: stats.find((item) => item.title === meta.title)?.value ?? 0,
  }));

  return (
    <div className="space-y-6 bg-transparent p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500">Bienvenue ! Voici vos performances aujourd'hui.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/ecommerce-dashboard">
            <Button variant="outline" className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50">
              <Store className="mr-2 h-4 w-4" />
              KPI e-commerce
            </Button>
          </Link>
          <Link to="/generate">
            <Button className="border border-[#C9B8FF] bg-[#7C3AED] shadow-lg shadow-violet-500/20 hover:bg-[#6D28D9]">
              <Sparkles className="mr-2 h-4 w-4" />
              Generer un post
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="flex items-center text-sm font-medium text-cyan-600">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      Live
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`} style={{ boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <CardHeader><CardTitle className="text-slate-900">Leads hebdomadaires</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "8px", color: "#0f172a" }} />
                <Bar dataKey="leads" fill="url(#colorLeads)" radius={[8, 8, 0, 0]} />
                <defs><linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#2563eb" /></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <CardHeader><CardTitle className="text-slate-900">Engagement hebdomadaire</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "8px", color: "#0f172a" }} />
                <Line type="monotone" dataKey="engagement" stroke="#06b6d4" strokeWidth={3} dot={{ fill: "#06b6d4", r: 4 }} filter="drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900">Leads recents</CardTitle>
            <Link to="/pipeline"><Button variant="ghost" size="sm" className="text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800">Voir tout<ArrowUpRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLeads.length === 0 && <div className="text-sm text-slate-500">Aucun lead recent pour le moment.</div>}
            {recentLeads.map((lead) => (
              <div key={`${lead.name}-${lead.status}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-cyan-200 hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-2 ring-cyan-100">
                    <span className="text-sm font-semibold text-cyan-700">{lead.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{lead.name}</p>
                    <p className="text-sm text-slate-500">{lead.title || "Headline indisponible"}</p>
                  </div>
                </div>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">{lead.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
