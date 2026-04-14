import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Linkedin, Lock, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";

export function AuthPage() {
  const navigate = useNavigate();
  const { session, loading, login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session?.authenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ username, password });
        toast.success("Session ouverte.");
      } else {
        await signup({
          username,
          password,
          email,
          first_name: firstName,
          last_name: lastName,
        });
        toast.success("Compte cree et session ouverte.");
      }
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentification impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(109,103,217,0.08),_transparent_30%),radial-gradient(circle_at_right_top,_rgba(56,189,248,0.06),_transparent_26%),linear-gradient(180deg,_#FFFFFF,_#FFFFFF)] px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/40">
                <Linkedin className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">LinkedBoost</h1>
                <p className="text-slate-400">Chaque utilisateur garde sa propre session et son propre compte LinkedIn.</p>
              </div>
            </div>
            <div className="space-y-4 text-slate-300">
              <p>Cette couche de connexion evite qu&apos;un autre utilisateur reutilise le profil de travail ou la session LinkedIn deja presente dans la base.</p>
              <p>Connecte-toi avec ton compte applicatif, puis configure et publie uniquement avec tes propres credentials LinkedIn dans les parametres.</p>
            </div>
          </div>

          <Card className="border border-cyan-500/20 bg-slate-950/90 shadow-2xl shadow-cyan-500/10">
            <CardHeader>
              <CardTitle className="text-white">{mode === "login" ? "Connexion" : "Creer un compte"}</CardTitle>
              <CardDescription className="text-slate-400">
                {mode === "login" ? "Ouvre ta session de travail." : "Cree un utilisateur isole pour ton espace."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-1">
                <Button type="button" variant={mode === "login" ? "default" : "ghost"} className={mode === "login" ? "bg-cyan-600 hover:bg-cyan-700" : "text-slate-300"} onClick={() => setMode("login")}>
                  Connexion
                </Button>
                <Button type="button" variant={mode === "signup" ? "default" : "ghost"} className={mode === "signup" ? "bg-cyan-600 hover:bg-cyan-700" : "text-slate-300"} onClick={() => setMode("signup")}>
                  Inscription
                </Button>
              </div>

              {mode === "signup" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Prenom</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-cyan-500/30 bg-black text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Nom</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-cyan-500/30 bg-black text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-cyan-500/30 bg-black text-white" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Nom d&apos;utilisateur</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="border-cyan-500/30 bg-black pl-9 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Mot de passe</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-cyan-500/30 bg-black pl-9 text-white" />
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 hover:from-cyan-600 hover:to-blue-700"
                onClick={() => void handleSubmit()}
                disabled={submitting || !username.trim() || !password.trim()}
              >
                {submitting ? "Traitement..." : mode === "login" ? "Se connecter" : "Creer le compte"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
