import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { ArrowRight, User, Briefcase, Target, MessageCircle } from "lucide-react";
import { fetchProfile, saveProfile, type ProfilePayload } from "../lib/api";

const emptyForm: ProfilePayload = {
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

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchProfile()
      .then((response) => {
        setFormData((prev) => ({
          ...prev,
          ...response.profile,
          linkedin_password: "",
          qwen_api_key: "",
        }));
      })
      .catch(() => {});
  }, []);

  const updateField = (field: keyof ProfilePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    setIsSaving(true);
    try {
      await saveProfile(formData);
      toast.success("Profil créé avec succès !");
      setTimeout(() => navigate("/"), 600);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: "Profil personnel", icon: User },
    { number: 2, title: "Entreprise", icon: Briefcase },
    { number: 3, title: "Cible (ICP)", icon: Target },
    { number: 4, title: "Stratégie", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const Icon = s.icon;
            return (
              <div key={s.number} className="flex items-center">
                <div className={`flex items-center gap-3 ${step >= s.number ? "text-cyan-400" : "text-slate-600"}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${step >= s.number ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50" : "bg-slate-900 text-slate-600 border border-slate-800"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium">{s.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-1 w-16 rounded ${step > s.number ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-slate-900"}`} />
                )}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <Card className="border border-cyan-500/20 shadow-lg shadow-cyan-500/10 bg-gradient-to-br from-slate-900 to-slate-950">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Votre profil personnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">Prénom *</Label>
                  <Input id="firstName" value={formData.first_name} onChange={(e) => updateField("first_name", e.target.value)} placeholder="Jean" className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">Nom *</Label>
                  <Input id="lastName" value={formData.last_name} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Dupont" className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">Titre professionnel *</Label>
                <Input id="title" value={formData.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Consultant en Marketing Digital" className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Description personnelle *</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Décrivez qui vous êtes, votre expertise, votre parcours..." rows={4} className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border border-cyan-500/20 shadow-lg shadow-cyan-500/10 bg-gradient-to-br from-slate-900 to-slate-950">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Votre entreprise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-300">Nom de l'entreprise *</Label>
                  <Input id="company" value={formData.company} onChange={(e) => updateField("company", e.target.value)} placeholder="Ma Startup" className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector" className="text-slate-300">Secteur d'activité *</Label>
                  <Input id="sector" value={formData.sector} onChange={(e) => updateField("sector", e.target.value)} placeholder="SaaS B2B" className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyDescription" className="text-slate-300">Description de l'entreprise *</Label>
                <Textarea id="companyDescription" value={formData.company_description} onChange={(e) => updateField("company_description", e.target.value)} placeholder="Que fait votre entreprise ? Quelle valeur apportez-vous ?" rows={4} className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-slate-300">Nom du produit/service (optionnel)</Label>
                <Input id="productName" value={formData.product_name} onChange={(e) => updateField("product_name", e.target.value)} placeholder="LeadGen Pro" className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productBenefits" className="text-slate-300">Bénéfices clés</Label>
                  <Input id="productBenefits" value={formData.product_benefits} onChange={(e) => updateField("product_benefits", e.target.value)} placeholder="Gain de temps, ROI mesurable..." className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productPrice" className="text-slate-300">Prix</Label>
                  <Input id="productPrice" value={formData.product_price} onChange={(e) => updateField("product_price", e.target.value)} placeholder="99€/mois" className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border border-cyan-500/20 shadow-lg shadow-cyan-500/10 bg-gradient-to-br from-slate-900 to-slate-950">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Votre client idéal (ICP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetTitle" className="text-slate-300">Titre de poste visé *</Label>
                <Input id="targetTitle" value={formData.target_title} onChange={(e) => updateField("target_title", e.target.value)} placeholder="CEO, CMO, Head of Sales..." className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetSector" className="text-slate-300">Secteur *</Label>
                  <Input id="targetSector" value={formData.target_sector} onChange={(e) => updateField("target_sector", e.target.value)} placeholder="SaaS, E-commerce, Consulting..." className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetCompanySize" className="text-slate-300">Taille d'entreprise *</Label>
                  <Select value={formData.target_company_size} onValueChange={(v) => updateField("target_company_size", v)}>
                    <SelectTrigger className="bg-black border-cyan-500/30 text-white focus:border-cyan-500">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-cyan-500/30">
                      <SelectItem value="1-10">1-10 employés</SelectItem>
                      <SelectItem value="11-50">11-50 employés</SelectItem>
                      <SelectItem value="51-200">51-200 employés</SelectItem>
                      <SelectItem value="201-500">201-500 employés</SelectItem>
                      <SelectItem value="500+">500+ employés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetCountry" className="text-slate-300">Pays ciblé *</Label>
                <Input id="targetCountry" value={formData.target_country} onChange={(e) => updateField("target_country", e.target.value)} placeholder="France, Belgique, Suisse..." className="bg-black border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="border border-cyan-500/20 shadow-lg shadow-cyan-500/10 bg-gradient-to-br from-slate-900 to-slate-950">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Votre stratégie de contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-slate-300">Ton préféré *</Label>
                <Select value={formData.tone} onValueChange={(v) => updateField("tone", v)}>
                  <SelectTrigger className="bg-black border-cyan-500/30 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Sélectionner votre ton" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-cyan-500/30">
                    <SelectItem value="thought_leader">Thought Leader</SelectItem>
                    <SelectItem value="storyteller">Storyteller</SelectItem>
                    <SelectItem value="educator">Éducateur</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective" className="text-slate-300">Objectif principal *</Label>
                <Select value={formData.objective} onValueChange={(v) => updateField("objective", v)}>
                  <SelectTrigger className="bg-black border-cyan-500/30 text-white focus:border-cyan-500">
                    <SelectValue placeholder="Sélectionner votre objectif" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-cyan-500/30">
                    <SelectItem value="awareness">Notoriété</SelectItem>
                    <SelectItem value="leads">Génération de leads</SelectItem>
                    <SelectItem value="sales">Ventes directes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                <h3 className="mb-2 font-semibold text-cyan-400">Récapitulatif</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  <li>{formData.first_name} {formData.last_name} - {formData.title}</li>
                  <li>{formData.company} ({formData.sector})</li>
                  <li>Cible: {formData.target_title} en {formData.target_sector}</li>
                  <li>Objectif: {formData.objective === "awareness" ? "Notoriété" : formData.objective === "leads" ? "Leads" : "Ventes"}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 disabled:opacity-30">
            Précédent
          </Button>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 border border-cyan-400/30" onClick={() => void handleNext()} disabled={isSaving}>
            {step === 4 ? (isSaving ? "Sauvegarde..." : "Terminer") : "Suivant"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
