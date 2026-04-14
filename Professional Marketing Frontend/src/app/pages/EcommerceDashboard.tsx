import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { AlertTriangle, ArrowUpRight, CheckCircle2, RefreshCw, ShoppingBag, Sparkles, Target, TrendingDown, TrendingUp, Wifi } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { clearStoredConfig, loadStoredConfig, saveLatestDashboardData } from "../dashboard/config";
import { useDashboardData } from "../dashboard/services/scraperService";
import type { ProductKPI } from "../dashboard/types";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

function num(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value || 0);
}

function pct(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(0)}%`;
}

function dateLabel(value: string | null) {
  if (!value) return "Aucune vente";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function badgeLabel(status: ProductKPI["statusBadge"]) {
  if (status === "best_seller") return "Best seller";
  if (status === "no_customers") return "Sans traction";
  if (status === "declining") return "En baisse";
  if (status === "low_stock_bestseller") return "Rupture proche";
  if (status === "inactive") return "A relancer";
  return "Stable";
}

function badgeClass(status: ProductKPI["statusBadge"]) {
  if (status === "best_seller") return "border-transparent bg-emerald-100 text-emerald-700";
  if (status === "no_customers") return "border-transparent bg-amber-100 text-amber-700";
  if (status === "declining") return "border-transparent bg-rose-100 text-rose-700";
  if (status === "low_stock_bestseller") return "border-transparent bg-orange-100 text-orange-700";
  if (status === "inactive") return "border-transparent bg-slate-200 text-slate-700";
  return "border-transparent bg-cyan-100 text-cyan-700";
}

function mergeSeries(products: ProductKPI[]) {
  const bucket = new Map<string, { weekLabel: string; sales: number; revenue: number }>();
  products.forEach((product) => {
    product.weeklyData.forEach((point) => {
      const current = bucket.get(point.week) ?? { weekLabel: point.weekLabel, sales: 0, revenue: 0 };
      current.sales += point.sales;
      current.revenue += point.revenue;
      bucket.set(point.week, current);
    });
  });
  return [...bucket.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, value]) => ({
    weekLabel: value.weekLabel,
    sales: value.sales,
    revenue: Math.round(value.revenue),
  }));
}

function productInsight(product: ProductKPI) {
  if (product.statusBadge === "no_customers") return "Produit avec stock mais traction faible. Priorite a la decouverte et a la preuve sociale.";
  if (product.statusBadge === "declining") return `Le produit ralentit (${pct(product.tendancePercent)}). Une offre de relance est recommandee.`;
  if (product.statusBadge === "low_stock_bestseller") return "Le produit vend bien mais risque une rupture. Reapprovisionnement et communication rarete.";
  if (product.statusBadge === "inactive") return "Le produit est inactif. Il faut une campagne de reactivation ou un bundle.";
  if (product.tendance === "hausse") return `Le produit accelere (${pct(product.tendancePercent)}). C'est un bon candidat pour amplifier le budget.`;
  return "Le produit reste stable. Surveillance simple recommandee.";
}

function buildActions(products: ProductKPI[]) {
  const actions: string[] = [];
  const growing = [...products].sort((a, b) => b.tendancePercent - a.tendancePercent)[0];
  const risk = [...products].sort((a, b) => b.scoreMarketing - a.scoreMarketing)[0];
  const lowStock = products.find((product) => product.statusBadge === "low_stock_bestseller");
  if (growing) actions.push(`Pousser ${growing.name} qui est la meilleure dynamique de la categorie (${pct(growing.tendancePercent)}).`);
  if (risk) actions.push(`Traiter ${risk.name} en priorite: score marketing ${risk.scoreMarketing}/100.`);
  if (lowStock) actions.push(`Securiser le stock de ${lowStock.name} avant rupture ou jouer un angle de rarete.`);
  if (!actions.length) actions.push("Categorie stable. Consolider les best sellers et suivre le stock.");
  return actions;
}

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ name: string; value: number }>;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-slate-500">{entry.name}</span>
            <span className="font-semibold text-slate-900">{entry.name.toLowerCase().includes("revenu") ? money(entry.value) : num(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EcommerceDashboard() {
  const navigate = useNavigate();
  const config = useMemo(() => loadStoredConfig(), []);
  const { data, loading, error, lastUpdated, refresh } = useDashboardData(config);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!data.error && data.products.length > 0) saveLatestDashboardData(data);
  }, [data]);

  const categories = useMemo(() => ["all", ...new Set(data.products.map((product) => product.category).filter(Boolean))], [data.products]);
  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory("all");
  }, [categories, selectedCategory]);

  const products = useMemo(() => selectedCategory === "all" ? data.products : data.products.filter((product) => product.category === selectedCategory), [data.products, selectedCategory]);
  const categoryName = selectedCategory === "all" ? "Toutes les categories" : selectedCategory;
  const revenue = products.reduce((sum, product) => sum + product.revenueProduit, 0);
  const sales = products.reduce((sum, product) => sum + product.totalSales, 0);
  const stock = products.reduce((sum, product) => sum + product.stock, 0);
  const weak = products.filter((product) => product.statusBadge === "declining" || product.statusBadge === "inactive").length;
  const growing = products.filter((product) => product.tendance === "hausse").length;
  const avgPrice = products.length ? products.reduce((sum, product) => sum + product.price, 0) / products.length : 0;
  const series = useMemo(() => mergeSeries(products), [products]);
  const topRevenue = useMemo(() => [...products].sort((a, b) => b.revenueProduit - a.revenueProduit).slice(0, 5), [products]);
  const priority = useMemo(() => [...products].sort((a, b) => b.scoreMarketing - a.scoreMarketing)[0] ?? null, [products]);
  const actions = useMemo(() => buildActions(products), [products]);
  const mix = useMemo(() => topRevenue.map((product) => ({ name: product.name.length > 18 ? `${product.name.slice(0, 18)}...` : product.name, revenue: Math.round(product.revenueProduit), sales: product.totalSales })), [topRevenue]);

  if (!config) return <Navigate to="/connect-store" replace />;

  return (
    <TooltipProvider>
      <div className="space-y-6 bg-transparent p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard e-commerce</h1>
            <p className="text-slate-500">Vue analytique par categorie, structuree pour tirer des insights rapidement.</p>
            {lastUpdated && <p className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-emerald-600"><Wifi className="h-3.5 w-3.5" />Flux actif {lastUpdated.toLocaleTimeString("fr-FR")}</p>}
          </div>
          <div className="flex gap-3">
            <Button type="button" className="border border-[#C9B8FF] bg-[#7C3AED] text-white hover:bg-[#6D28D9]" onClick={() => navigate("/generate?source=kpi")}>Generer une campagne</Button>
            <Button type="button" variant="outline" className="border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
            <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => { clearStoredConfig(); navigate("/connect-store"); }}>Changer de source</Button>
            <Link to="/dashboard"><Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">Retour dashboard</Button></Link>
          </div>
        </div>

        {(error || data.error) && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5" /><p>{error || data.errorMessage}</p></div>
          </div>
        )}

        <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <CardContent className="flex flex-wrap items-end justify-between gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Filtre principal</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{categoryName}</h2>
              <p className="mt-1 text-sm text-slate-500">Le dashboard n'affiche que les produits et insights de la categorie choisie.</p>
            </div>
            <div className="w-full max-w-xs">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900">
                  <SelectValue placeholder="Choisir une categorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => <SelectItem key={category} value={category}>{category === "all" ? "Toutes les categories" : category}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "CA categorie", value: money(revenue), help: "Revenu total de la categorie.", tone: "from-cyan-500 to-blue-600" },
            { title: "Unites vendues", value: num(sales), help: "Volume total vendu dans la categorie.", tone: "from-emerald-500 to-teal-600" },
            { title: "Stock restant", value: num(stock), help: "Stock restant pour cette categorie.", tone: "from-amber-500 to-orange-600" },
            { title: "Produits sous surveillance", value: num(weak), help: "Produits en baisse ou inactifs.", tone: "from-rose-500 to-red-600" },
          ].map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm text-slate-500">{item.title}</p><p className="mt-3 text-3xl font-bold text-slate-900">{loading ? "..." : item.value}</p></div>
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.tone}`} />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs rounded-xl bg-slate-900 text-white">{item.help}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3 rounded-2xl bg-slate-100 p-1">
            <TabsTrigger value="overview" className="rounded-xl">Synthese</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl">Produits</TabsTrigger>
            <TabsTrigger value="actions" className="rounded-xl">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <CardHeader><CardTitle className="text-slate-900">Synthese executive</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white"><Sparkles className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Insight principal</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">{priority ? `${priority.name} concentre l'attention business` : "Aucun produit prioritaire"}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{priority ? `${priority.name} porte un score marketing de ${priority.scoreMarketing}/100, une tendance de ${pct(priority.tendancePercent)} et un revenu de ${money(priority.revenueProduit)}.` : "Aucune donnee exploitable pour cette categorie."}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Prix moyen</p><p className="mt-2 text-2xl font-bold text-slate-900">{money(avgPrice)}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Produits en croissance</p><p className="mt-2 text-2xl font-bold text-emerald-600">{num(growing)}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Produits suivis</p><p className="mt-2 text-2xl font-bold text-slate-900">{num(products.length)}</p></div>
                  </div>

                  <div className="h-80 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-4 text-sm text-slate-500">Evolution hebdomadaire de la categorie</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="weekLabel" stroke="#64748B" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#64748B" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<ChartTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="sales" name="Ventes" fill="#0F766E" radius={[8, 8, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenu" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <CardHeader><CardTitle className="text-slate-900">Insights organises</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "Top revenu", tone: "text-emerald-700 bg-emerald-50 border-emerald-200", body: topRevenue[0] ? `${topRevenue[0].name} mene la categorie avec ${money(topRevenue[0].revenueProduit)} de revenu.` : "Aucune donnee." },
                    { title: "Point de vigilance", tone: "text-rose-700 bg-rose-50 border-rose-200", body: priority ? productInsight(priority) : "Aucun signal critique." },
                    { title: "Lecture portefeuille", tone: "text-cyan-700 bg-cyan-50 border-cyan-200", body: `${num(growing)} produit(s) accelerent et ${num(weak)} produit(s) doivent etre surveilles.` },
                    { title: "Action stock", tone: "text-amber-700 bg-amber-50 border-amber-200", body: `${num(stock)} unites restent sur cette categorie. A croiser avec le rythme de ventes et les best sellers.` },
                  ].map((item) => (
                    <div key={item.title} className={`rounded-2xl border p-4 ${item.tone}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6">{item.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <CardHeader><CardTitle className="text-slate-900">Produits de la categorie</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {topRevenue.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {product.image ? <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" /> : <div className="h-16 w-16 rounded-xl bg-slate-200" />}
                          <div>
                            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{product.name}</p><Badge className={badgeClass(product.statusBadge)}>{badgeLabel(product.statusBadge)}</Badge></div>
                            <p className="text-sm text-slate-500">{product.category}</p>
                            <p className="mt-2 text-sm text-slate-600">Derniere vente: {dateLabel(product.lastSaleDate)}</p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${product.tendance === "hausse" ? "text-emerald-600" : product.tendance === "baisse" ? "text-red-600" : "text-slate-500"}`}>{pct(product.tendancePercent)}</p>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">CA: <span className="font-semibold text-slate-900">{money(product.revenueProduit)}</span></div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">Ventes: <span className="font-semibold text-slate-900">{product.totalSales}</span></div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">Stock: <span className="font-semibold text-slate-900">{product.stock}</span></div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">Score: <span className="font-semibold text-slate-900">{product.scoreMarketing}</span></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <CardHeader><CardTitle className="text-slate-900">Mix produit</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mix} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<ChartTooltip />} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenu" radius={[8, 8, 0, 0]}>{mix.map((entry) => <Cell key={entry.name} fill="#2563EB" />)}</Bar>
                        <Bar dataKey="sales" name="Ventes" fill="#0F766E" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {priority && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Produit focus</p><p className="text-lg font-semibold text-slate-900">{priority.name}</p></div><Badge className={badgeClass(priority.statusBadge)}>{badgeLabel(priority.statusBadge)}</Badge></div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={priority.weeklyData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                            <defs><linearGradient id="focus-sales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0.05} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="weekLabel" stroke="#64748B" tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
                            <RechartsTooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="sales" name="Ventes" stroke="#7C3AED" fill="url(#focus-sales)" strokeWidth={3} />
                            <Area type="monotone" dataKey="revenue" name="Revenu" stroke="#06B6D4" fillOpacity={0} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <CardHeader><CardTitle className="text-slate-900">Plan d'action</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {actions.map((action) => (
                    <div key={action} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="flex items-start gap-3 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{action}</span></p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <CardHeader><CardTitle className="text-slate-900">Produit prioritaire</CardTitle></CardHeader>
                <CardContent>
                  {priority ? (
                    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          {priority.image ? <img src={priority.image} alt={priority.name} className="h-20 w-20 rounded-2xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100"><ShoppingBag className="h-8 w-8 text-slate-400" /></div>}
                          <div>
                            <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold text-slate-900">{priority.name}</h3><Badge className={badgeClass(priority.statusBadge)}>{badgeLabel(priority.statusBadge)}</Badge></div>
                            <p className="mt-1 text-sm text-slate-500">{priority.category}</p>
                            <p className="mt-3 text-sm text-slate-600">Revenu: {money(priority.revenueProduit)}</p>
                            <p className="mt-1 text-sm text-slate-600">Derniere vente: {dateLabel(priority.lastSaleDate)}</p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Ventes</p><p className="mt-2 text-xl font-bold text-slate-900">{priority.totalSales}</p></div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Stock</p><p className="mt-2 text-xl font-bold text-slate-900">{priority.stock}</p></div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Score</p><p className="mt-2 text-xl font-bold text-slate-900">{priority.scoreMarketing}/100</p></div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Tendance</p><p className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-900">{priority.tendance === "hausse" ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : priority.tendance === "baisse" ? <TrendingDown className="h-5 w-5 text-red-500" /> : <ArrowUpRight className="h-5 w-5 text-slate-400" />}{pct(priority.tendancePercent)}</p></div>
                        </div>
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-slate-700"><p className="flex items-center gap-2 font-medium text-cyan-700"><Target className="h-4 w-4" />Recommendation</p><p className="mt-2">{productInsight(priority)}</p></div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-3 text-sm text-slate-500">Evolution du produit prioritaire</p>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={priority.weeklyData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                              <defs><linearGradient id="priority-sales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} /><stop offset="100%" stopColor="#06B6D4" stopOpacity={0.05} /></linearGradient></defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                              <XAxis dataKey="weekLabel" stroke="#64748B" tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
                              <RechartsTooltip content={<ChartTooltip />} />
                              <Area type="monotone" dataKey="sales" name="Ventes" stroke="#0891B2" fill="url(#priority-sales)" strokeWidth={3} />
                              <Area type="monotone" dataKey="revenue" name="Revenu" stroke="#1D4ED8" fillOpacity={0} strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">Aucun produit disponible pour cette categorie.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
