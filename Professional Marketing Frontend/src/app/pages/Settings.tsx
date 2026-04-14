import { useEffect, useState } from "react";
import { User, Linkedin, Bell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { fetchProfile, saveProfile, syncOpenOutreach, type ProfilePayload, type ProfileResponse } from "../lib/api";

type SettingsForm = ProfilePayload & { email: string };

const defaultForm: SettingsForm = {
  first_name: "",
  last_name: "",
  email: "",
  title: "",
  description: "",
  company: "",
  sector: "",
  company_description: "",
  product_name: "",
  product_description: "",
  product_benefits: "",
  product_price: "",
  target_title: "",
  target_sector: "",
  target_company_size: "",
  target_country: "",
  tone: "",
  objective: "",
  linkedin_email: "",
  linkedin_password: "",
  qwen_api_key: "",
  qwen_api_base: "",
  qwen_model: "",
  auto_publish: false,
  auto_connect: true,
  auto_follow_up: true,
};

export function Settings() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [meta, setMeta] = useState<ProfileResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((response) => {
        setMeta(response.profile);
        setForm({
          ...defaultForm,
          ...response.profile,
          linkedin_password: "",
          qwen_api_key: "",
        });
      })
      .catch(() => {});
  }, []);

  const updateField = (field: keyof SettingsForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (payload?: Partial<SettingsForm>) => {
    setIsSaving(true);
    try {
      const response = await saveProfile(payload ?? form);
      setMeta(response.profile);
      setForm((prev) => ({
        ...prev,
        ...response.profile,
        linkedin_password: "",
        qwen_api_key: "",
      }));
      toast.success("Parametres sauvegardes avec succes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await syncOpenOutreach();
      setMeta(response.profile);
      toast.success(`Synchronise vers ${response.sync.campaign_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Synchronisation impossible.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Parametres</h1>
          <p className="text-slate-500">Renseigne le contexte complet utilise par la generation et la qualification des leads.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 border border-slate-200 bg-white lg:inline-grid lg:w-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 text-slate-600 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Profil de travail</CardTitle>
                <CardDescription className="text-slate-500">
                  Ces champs alimentent directement `campaign_objective` et `product_docs` utilises par le daemon.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700">Prenom</Label>
                    <Input id="firstName" value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700">Nom</Label>
                    <Input id="lastName" value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-700">Titre professionnel</Label>
                    <Input id="title" value={form.title} onChange={(e) => updateField("title", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Ton prefere</Label>
                    <Select value={form.tone} onValueChange={(value) => updateField("tone", value)}>
                      <SelectTrigger className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500">
                        <SelectValue placeholder="Selectionner votre ton" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-200 bg-white text-slate-900">
                        <SelectItem value="thought_leader">Thought Leader</SelectItem>
                        <SelectItem value="storyteller">Storyteller</SelectItem>
                        <SelectItem value="educator">Educateur</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700">Description personnelle</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={4} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                </div>

                <Separator className="bg-slate-200" />

                <div className="space-y-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Entreprise et offre</h3>
                  <p className="text-sm text-slate-500">Le daemon s'en sert pour comprendre ce que tu vends et a qui cela correspond.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-700">Entreprise</Label>
                    <Input id="company" value={form.company} onChange={(e) => updateField("company", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector" className="text-slate-700">Secteur</Label>
                    <Input id="sector" value={form.sector} onChange={(e) => updateField("sector", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyDescription" className="text-slate-700">Description de l'entreprise</Label>
                  <Textarea id="companyDescription" value={form.company_description} onChange={(e) => updateField("company_description", e.target.value)} rows={4} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productName" className="text-slate-700">Produit ou service</Label>
                    <Input id="productName" value={form.product_name} onChange={(e) => updateField("product_name", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productPrice" className="text-slate-700">Prix</Label>
                    <Input id="productPrice" value={form.product_price} onChange={(e) => updateField("product_price", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productDescription" className="text-slate-700">Description de l'offre</Label>
                  <Textarea id="productDescription" value={form.product_description} onChange={(e) => updateField("product_description", e.target.value)} rows={4} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productBenefits" className="text-slate-700">Benefices cles</Label>
                  <Textarea id="productBenefits" value={form.product_benefits} onChange={(e) => updateField("product_benefits", e.target.value)} rows={3} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                </div>

                <Separator className="bg-slate-200" />

                <div className="space-y-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Client ideal</h3>
                  <p className="text-sm text-slate-500">Ces champs servent a cibler et qualifier les bons prospects dans LinkedIn People Search.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetTitle" className="text-slate-700">Titre de poste vise</Label>
                  <Input id="targetTitle" value={form.target_title} onChange={(e) => updateField("target_title", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetSector" className="text-slate-700">Secteur cible</Label>
                    <Input id="targetSector" value={form.target_sector} onChange={(e) => updateField("target_sector", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Taille d'entreprise ciblee</Label>
                    <Select value={form.target_company_size} onValueChange={(value) => updateField("target_company_size", value)}>
                      <SelectTrigger className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500">
                        <SelectValue placeholder="Selectionner" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-200 bg-white text-slate-900">
                        <SelectItem value="1-10">1-10 employes</SelectItem>
                        <SelectItem value="11-50">11-50 employes</SelectItem>
                        <SelectItem value="51-200">51-200 employes</SelectItem>
                        <SelectItem value="201-500">201-500 employes</SelectItem>
                        <SelectItem value="500+">500+ employes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetCountry" className="text-slate-700">Pays cible</Label>
                    <Input id="targetCountry" value={form.target_country} onChange={(e) => updateField("target_country", e.target.value)} className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Objectif principal</Label>
                    <Select value={form.objective} onValueChange={(value) => updateField("objective", value)}>
                      <SelectTrigger className="border-slate-200 bg-white text-slate-900 focus:border-cyan-500">
                        <SelectValue placeholder="Selectionner votre objectif" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-200 bg-white text-slate-900">
                        <SelectItem value="awareness">Notoriete</SelectItem>
                        <SelectItem value="leads">Generation de leads</SelectItem>
                        <SelectItem value="sales">Ventes directes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-600">
                  Plus ces champs sont precis, plus la recherche et la qualification des leads seront pertinentes.
                </div>

                <Button className="border border-cyan-400/30 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 hover:from-cyan-600 hover:to-blue-700" onClick={() => void handleSave()} disabled={isSaving}>
                  Sauvegarder les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linkedin">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Configuration LinkedIn</CardTitle>
                <CardDescription className="text-slate-500">Connecte le compte LinkedIn qui doit publier et executer le pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`rounded-lg border p-4 ${meta?.openoutreach_campaign_id ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta?.openoutreach_campaign_id ? "bg-emerald-600 shadow-lg shadow-emerald-500/50" : "bg-amber-600 shadow-lg shadow-amber-500/50"}`}>
                      <Linkedin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className={`font-semibold ${meta?.openoutreach_campaign_id ? "text-emerald-400" : "text-amber-400"}`}>
                        {meta?.openoutreach_campaign_id ? "Compte synchronise" : "Compte non synchronise"}
                      </p>
                      <p className={`text-sm ${meta?.openoutreach_campaign_id ? "text-emerald-300" : "text-amber-300"}`}>
                        {form.linkedin_email || "Aucun email LinkedIn"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Email LinkedIn</Label>
                  <Input value={form.linkedin_email} onChange={(e) => updateField("linkedin_email", e.target.value)} className="bg-black border-cyan-500/30 text-white focus:border-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Mot de passe LinkedIn</Label>
                  <Input type="password" value={form.linkedin_password} onChange={(e) => updateField("linkedin_password", e.target.value)} placeholder={meta?.linkedin_password_configured ? "Mot de passe deja configure" : "Saisissez le mot de passe"} className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Publication automatique</Label>
                      <p className="text-sm text-slate-500">Publier automatiquement les posts generes.</p>
                    </div>
                    <Switch checked={Boolean(form.auto_publish)} onCheckedChange={(checked) => updateField("auto_publish", checked)} />
                  </div>
                  <Separator className="bg-slate-800" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Demandes de connexion automatiques</Label>
                      <p className="text-sm text-slate-500">Envoyer des demandes aux leads qualifies.</p>
                    </div>
                    <Switch checked={Boolean(form.auto_connect)} onCheckedChange={(checked) => updateField("auto_connect", checked)} />
                  </div>
                  <Separator className="bg-slate-800" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Messages de suivi</Label>
                      <p className="text-sm text-slate-500">Envoyer des messages personnalises apres connexion.</p>
                    </div>
                    <Switch checked={Boolean(form.auto_follow_up)} onCheckedChange={(checked) => updateField("auto_follow_up", checked)} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="border border-cyan-400/30 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 hover:from-cyan-600 hover:to-blue-700" onClick={() => void handleSave()} disabled={isSaving}>
                    Sauvegarder LinkedIn
                  </Button>
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300" onClick={() => void handleSync()} disabled={isSyncing}>
                    {isSyncing ? "Synchronisation..." : "Synchroniser OpenOutreach"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Preferences de notifications</CardTitle>
                <CardDescription className="text-slate-500">Choisis les automatisations a garder actives.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Nouveaux leads</Label>
                      <p className="text-sm text-slate-500">Activer le flux de connexion automatique.</p>
                    </div>
                    <Switch checked={Boolean(form.auto_connect)} onCheckedChange={(checked) => updateField("auto_connect", checked)} />
                  </div>
                  <Separator className="bg-slate-800" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Connexions acceptees</Label>
                      <p className="text-sm text-slate-500">Activer les messages de suivi automatiques.</p>
                    </div>
                    <Switch checked={Boolean(form.auto_follow_up)} onCheckedChange={(checked) => updateField("auto_follow_up", checked)} />
                  </div>
                </div>

                <Button className="border border-cyan-400/30 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 hover:from-cyan-600 hover:to-blue-700" onClick={() => void handleSave()} disabled={isSaving}>
                  Sauvegarder les preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
