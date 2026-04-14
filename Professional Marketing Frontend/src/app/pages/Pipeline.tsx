import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, MessageSquare, Search, UserPlus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { fetchPipeline } from "../lib/api";

const stageMeta: Record<string, { label: string; color: string; icon: typeof UserPlus }> = {
  Qualified: { label: "QUALIFIED", color: "from-cyan-500 to-blue-600", icon: CheckCircle2 },
  "Ready to Connect": { label: "ENRICHED", color: "from-blue-500 to-blue-600", icon: Search },
  Pending: { label: "PENDING", color: "from-amber-500 to-orange-600", icon: Clock },
  Connected: { label: "CONNECTED", color: "from-emerald-500 to-green-600", icon: CheckCircle2 },
  Completed: { label: "COMPLETED", color: "from-purple-500 to-pink-600", icon: MessageSquare },
  Failed: { label: "FAILED", color: "from-slate-500 to-slate-600", icon: UserPlus },
};

const statusBadges = {
  Qualified: { label: "Qualifie", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  "Ready to Connect": { label: "Enrichi", color: "bg-blue-50 text-blue-700 border-blue-200" },
  Pending: { label: "En attente", color: "bg-amber-50 text-amber-700 border-amber-200" },
  Connected: { label: "Connecte", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Completed: { label: "Complete", color: "bg-purple-50 text-purple-700 border-purple-200" },
  Failed: { label: "Echoue", color: "bg-slate-100 text-slate-700 border-slate-200" },
} satisfies Record<string, { label: string; color: string }>;

function getStatusBadge(status: string) {
  return statusBadges[status] ?? statusBadges.Failed;
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  const diffHours = Math.max(1, Math.round((Date.now() - date.getTime()) / 3600000));
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${Math.round(diffHours / 24)}j`;
}

export function Pipeline() {
  const [query, setQuery] = useState("");
  const [pipelineStages, setPipelineStages] = useState<{ stage: string; count: number }[]>([]);
  const [leads, setLeads] = useState<{ name: string; title: string; status: string; source: string; comment_text: string; last_activity: string }[]>([]);
  const [messages, setMessages] = useState<{ content: string; created_at: string; is_outgoing: boolean }[]>([]);
  const [rates, setRates] = useState({ pending_to_connected: 0, connected_to_completed: 0 });

  useEffect(() => {
    fetchPipeline()
      .then((response) => {
        setPipelineStages(response.stages);
        setLeads(response.leads);
        setMessages(response.messages);
        setRates(response.conversion_rates);
      })
      .catch(() => {});
  }, []);

  const filteredLeads = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) =>
      [lead.name, lead.title, lead.status, lead.source, lead.comment_text].some((value) => value.toLowerCase().includes(term)),
    );
  }, [leads, query]);

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pipeline de leads</h1>
            <p className="text-slate-500">Suivez vos prospects a chaque etape du funnel.</p>
          </div>
          <Button className="border border-[#C9B8FF] bg-[#7C3AED] text-white hover:bg-[#6D28D9]">Exporter les donnees</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {pipelineStages.map((stage, index) => {
            const meta = stageMeta[stage.stage] ?? { label: stage.stage.toUpperCase(), color: "from-slate-500 to-slate-600", icon: UserPlus };
            const Icon = meta.icon;
            const nextCount = pipelineStages[index + 1]?.count ?? 0;
            const ratio = stage.count > 0 ? Math.round((nextCount / stage.count) * 100) : 0;
            return (
              <Card key={stage.stage} className="relative overflow-hidden border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className={`absolute right-0 top-0 h-1 w-full bg-gradient-to-r ${meta.color}`} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{meta.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{stage.count}</p>
                    </div>
                    <Icon className="h-8 w-8 text-slate-300" />
                  </div>
                  {index < pipelineStages.length - 1 ? <div className="mt-2 text-xs text-slate-500">{ratio}% vers l'etape suivante</div> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-8">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">PENDING vers CONNECTED</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${rates.pending_to_connected}%` }} />
                  </div>
                  <span className="font-semibold text-emerald-600">{rates.pending_to_connected}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">CONNECTED vers COMPLETED</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${rates.connected_to_completed}%` }} />
                  </div>
                  <span className="font-semibold text-purple-600">{rates.connected_to_completed}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900">Leads recents</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un lead..."
                  className="w-64 border-slate-200 bg-white pl-9 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <div key={`${lead.name}-${lead.last_activity}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-cyan-300 hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 ring-2 ring-cyan-100">
                      <span className="text-sm font-semibold text-cyan-700">{lead.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{lead.name}</p>
                        <Badge className={`border ${getStatusBadge(lead.status).color}`}>{getStatusBadge(lead.status).label}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{lead.title || "Headline indisponible"}</p>
                      <p className="text-xs text-slate-500">{lead.source}</p>
                      {lead.comment_text ? <p className="text-xs text-slate-500">Commentaire: {lead.comment_text}</p> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatRelative(lead.last_activity)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 ? <div className="text-sm text-slate-500">Aucun lead a afficher.</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Historique des messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={`${message.created_at}-${message.content.slice(0, 20)}`} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-cyan-700">{message.is_outgoing ? "Message envoye" : "Message recu"}</span>
                    <span className="text-xs text-slate-500">{formatRelative(message.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{message.content}</p>
                </div>
              ))}
              {messages.length === 0 ? <div className="text-sm text-slate-500">Aucun message recent.</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
