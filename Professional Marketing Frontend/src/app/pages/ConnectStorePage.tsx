import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, PlugZap, Store, TriangleAlert } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { saveStoredConfig } from "../dashboard/config";
import { testConnection } from "../dashboard/services/scraperService";
import type { ApiConfig, Platform } from "../dashboard/types";

const defaultFieldMapping = JSON.stringify({
  id: "id",
  name: "name",
  price: "price",
  stock: "stock",
  totalSales: "totalSales",
  image: "image",
  category: "category",
}, null, 2);

const testConfig: ApiConfig = {
  platform: "custom",
  storeUrl: "",
  endpoints: {
    products: "/mock-ecommerce/products.json",
    orders: "/mock-ecommerce/orders.json",
  },
  authHeader: "",
  apiKey: "",
  fieldMapping: {
    id: "id",
    name: "name",
    price: "price",
    stock: "stock",
    totalSales: "totalSales",
    image: "image",
    category: "category",
  },
};

export function ConnectStorePage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("woocommerce");
  const [form, setForm] = useState({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: "",
    shopName: "",
    accessToken: "",
    productsEndpoint: "",
    ordersEndpoint: "",
    authHeader: "Authorization",
    apiKey: "",
    fieldMapping: defaultFieldMapping,
  });
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const config: ApiConfig = {
    platform,
    storeUrl: form.storeUrl,
    consumerKey: form.consumerKey,
    consumerSecret: form.consumerSecret,
    accessToken: form.accessToken,
    shopName: form.shopName,
    apiKey: form.apiKey,
    authHeader: form.authHeader,
    endpoints: platform === "custom" ? { products: form.productsEndpoint, orders: form.ordersEndpoint } : undefined,
    fieldMapping: platform === "custom" ? JSON.parse(form.fieldMapping || "{}") : undefined,
  };

  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testConnection(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({ ok: false, message: error instanceof Error ? error.message : "Connexion impossible." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(29,158,117,0.06),_transparent_28%),radial-gradient(circle_at_right_top,_rgba(56,189,248,0.05),_transparent_24%),linear-gradient(180deg,_#FFFFFF_0%,_#FFFFFF_100%)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <Card className="border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 shadow-lg shadow-emerald-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-3xl text-white">
              <Store className="h-8 w-8 text-emerald-400" />
              Connecter votre boutique
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configurez votre API e-commerce pour alimenter automatiquement le dashboard produit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Mode test</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Source e-commerce de demonstration</h2>
                  <p className="mt-2 text-sm leading-6 text-cyan-100/80">
                    Pour test rapide, utilisez un dataset e-commerce local d'un mois avec produits, commandes et evolution journaliere.
                  </p>
                </div>
                <Button
                  type="button"
                  className="bg-cyan-500 text-black hover:bg-cyan-400"
                  onClick={() => {
                    saveStoredConfig(testConfig);
                    navigate("/ecommerce-dashboard");
                  }}
                >
                  Utiliser le dataset mensuel
                </Button>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-400">Etape 1</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Choisir la plateforme</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { value: "woocommerce", label: "WooCommerce" },
                  { value: "shopify", label: "Shopify" },
                  { value: "custom", label: "Autre" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setPlatform(item.value as Platform);
                      setTestResult(null);
                    }}
                    className={`rounded-2xl border px-5 py-5 text-left transition ${
                      platform === item.value
                        ? "border-emerald-400 bg-emerald-500/10 text-white"
                        : "border-white/10 bg-black/20 text-slate-300 hover:border-emerald-500/30"
                    }`}
                  >
                    <p className="font-semibold">{item.label}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-400">Etape 2</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Saisir les credentials</h2>
              </div>

              {platform === "woocommerce" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">URL de la boutique</Label>
                    <Input value={form.storeUrl} onChange={(event) => update("storeUrl", event.target.value)} placeholder="https://ma-boutique.com" className="bg-black border-emerald-500/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Consumer Key</Label>
                    <Input value={form.consumerKey} onChange={(event) => update("consumerKey", event.target.value)} className="bg-black border-emerald-500/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Consumer Secret</Label>
                    <Input value={form.consumerSecret} onChange={(event) => update("consumerSecret", event.target.value)} className="bg-black border-emerald-500/30 text-white" />
                  </div>
                </div>
              )}

              {platform === "shopify" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nom du shop</Label>
                    <Input value={form.shopName} onChange={(event) => update("shopName", event.target.value)} placeholder="mon-shop" className="bg-black border-emerald-500/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Access Token</Label>
                    <Input value={form.accessToken} onChange={(event) => update("accessToken", event.target.value)} className="bg-black border-emerald-500/30 text-white" />
                  </div>
                </div>
              )}

              {platform === "custom" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">URL des produits</Label>
                    <Input value={form.productsEndpoint} onChange={(event) => update("productsEndpoint", event.target.value)} className="bg-black border-emerald-500/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">URL des commandes</Label>
                    <Input value={form.ordersEndpoint} onChange={(event) => update("ordersEndpoint", event.target.value)} className="bg-black border-emerald-500/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Header d'auth</Label>
                    <Input value={form.authHeader} onChange={(event) => update("authHeader", event.target.value)} placeholder="Authorization" className="bg-black border-emerald-500/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Valeur du token</Label>
                    <Input value={form.apiKey} onChange={(event) => update("apiKey", event.target.value)} placeholder="Bearer xxx" className="bg-black border-emerald-500/30 text-white" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">Mapping des champs</Label>
                    <Textarea value={form.fieldMapping} onChange={(event) => update("fieldMapping", event.target.value)} rows={8} className="bg-black border-emerald-500/30 font-mono text-white" />
                  </div>
                </div>
              )}
            </section>

            {testResult && (
              <div className={`rounded-xl border p-4 ${testResult.ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                <div className="flex items-center gap-3">
                  {testResult.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <TriangleAlert className="h-5 w-5 text-red-400" />}
                  <p className={`text-sm ${testResult.ok ? "text-emerald-300" : "text-red-300"}`}>{testResult.message}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void handleTest()} disabled={testing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <PlugZap className="mr-2 h-4 w-4" />
                {testing ? "Test en cours..." : "Tester la connexion"}
              </Button>
              <Button
                type="button"
                disabled={!testResult?.ok}
                className="bg-white text-black hover:bg-slate-200"
                onClick={() => {
                  saveStoredConfig(config);
                  navigate("/ecommerce-dashboard");
                }}
              >
                Connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
