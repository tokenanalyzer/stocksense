import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, Download, Phone, MessageCircle, LogOut, RefreshCw,
  TrendingUp, Users, Calendar, CheckCircle2, Loader2, AlertCircle,
  ChevronDown, ArrowLeft, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type LeadStatus = "New" | "Contacted" | "Follow-up" | "Converted";

interface Lead {
  rowIndex:    number;
  timestamp:   string;
  fullName:    string;
  mobile:      string;
  city:        string;
  experience:  string;
  contactTime: string;
  intent:      string;
  consent:     string;
  status:      LeadStatus;
}

/* ─── Config ─────────────────────────────────────────────────────────────────── */
const APPS_SCRIPT_URL  = import.meta.env.VITE_APPS_SCRIPT_URL  as string | undefined;
const ADMIN_PASSWORD   = import.meta.env.VITE_ADMIN_PASSWORD   as string | undefined;
const ADMIN_SESSION    = "stocksense_admin";

/* ─── API helpers ────────────────────────────────────────────────────────────── */
async function fetchLeads(token: string): Promise<Lead[]> {
  if (!APPS_SCRIPT_URL) return MOCK_LEADS;
  const url = `${APPS_SCRIPT_URL}?action=getLeads&token=${encodeURIComponent(token)}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Network error ${res.status}`);
  const json = await res.json() as { success: boolean; leads?: Lead[]; error?: string };
  if (!json.success) throw new Error(json.error ?? "Failed to fetch leads");
  return json.leads ?? [];
}

async function updateLeadStatus(token: string, rowIndex: number, status: LeadStatus): Promise<void> {
  if (!APPS_SCRIPT_URL) return; // mock: no-op
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "updateStatus", token, rowIndex, status })
  });
  if (!res.ok) throw new Error(`Network error ${res.status}`);
  const json = await res.json() as { success: boolean; error?: string };
  if (!json.success) throw new Error(json.error ?? "Status update failed");
}

/* ─── Mock data (shown when APPS_SCRIPT_URL is not configured) ───────────────── */
const MOCK_LEADS: Lead[] = [
  { rowIndex:2, timestamp:"01/06/2026 09:12:00", fullName:"Priya Sharma",    mobile:"9876543210", city:"Mumbai",    experience:"Complete Beginner",    contactTime:"Morning (10AM – 12PM)", intent:"Want to understand basics of stock market", consent:"Yes", status:"New" },
  { rowIndex:3, timestamp:"01/06/2026 10:34:00", fullName:"Rahul Mehta",     mobile:"9123456789", city:"Pune",      experience:"Have a Demat Account",  contactTime:"Evening (5PM – 7PM)",   intent:"Opened demat but no idea what to do",      consent:"Yes", status:"Contacted" },
  { rowIndex:4, timestamp:"01/06/2026 11:55:00", fullName:"Anjali Singh",    mobile:"9988776655", city:"Delhi",     experience:"Tried Trading",         contactTime:"Afternoon (1PM – 4PM)", intent:"Lost money, want to learn properly",        consent:"Yes", status:"Follow-up" },
  { rowIndex:5, timestamp:"31/05/2026 14:22:00", fullName:"Vikram Nair",     mobile:"9871234560", city:"Bangalore", experience:"Learning Actively",     contactTime:"Morning (10AM – 12PM)", intent:"Want structured curriculum",                consent:"Yes", status:"Converted" },
  { rowIndex:6, timestamp:"31/05/2026 16:45:00", fullName:"Sneha Patel",     mobile:"9765432109", city:"Ahmedabad", experience:"Complete Beginner",     contactTime:"Evening (5PM – 7PM)",   intent:"Curious about long-term investing",         consent:"Yes", status:"New" },
];

/* ─── Stats computation ──────────────────────────────────────────────────────── */
function computeStats(leads: Lead[]) {
  const now     = new Date();
  const todayStr = now.toLocaleDateString("en-GB");
  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let today = 0, weekly = 0, converted = 0;
  for (const l of leads) {
    // timestamp format: dd/MM/yyyy HH:mm:ss
    const parts = l.timestamp.split(" ")[0]?.split("/");
    if (parts && parts.length === 3) {
      const lDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (l.timestamp.startsWith(todayStr)) today++;
      if (lDate >= weekAgo) weekly++;
    }
    if (l.status === "Converted") converted++;
  }
  return { total: leads.length, today, weekly, converted };
}

/* ─── CSV export ─────────────────────────────────────────────────────────────── */
function exportCSV(leads: Lead[]) {
  const headers = ["Timestamp","Full Name","Mobile","City","Experience","Best Time","Intent","Consent","Status"];
  const rows    = leads.map(l => [
    `"${l.timestamp}"`, `"${l.fullName}"`, `"${l.mobile}"`, `"${l.city}"`,
    `"${l.experience}"`, `"${l.contactTime}"`, `"${l.intent.replace(/"/g,'""')}"`,
    `"${l.consent}"`, `"${l.status}"`
  ].join(","));
  const csv   = [headers.join(","), ...rows].join("\n");
  const blob  = new Blob([csv], { type: "text/csv" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href      = url;
  a.download  = `stocksense-leads-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Status badge ───────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<LeadStatus, string> = {
  "New":        "bg-blue-50 text-blue-700 border-blue-200",
  "Contacted":  "bg-amber-50 text-amber-700 border-amber-200",
  "Follow-up":  "bg-orange-50 text-orange-700 border-orange-200",
  "Converted":  "bg-green-50 text-green-700 border-green-200",
};

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

/* ─── Login Screen ───────────────────────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: (pass: string) => boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [, setLocation]         = useLocation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = onLogin(password);
    if (!ok) { setError("Incorrect password. Try again."); setPassword(""); }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 mb-5">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">StockSense Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Lead management dashboard</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Password</label>
              <Input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter admin password"
                className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
                data-testid="input-admin-password"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold"
              data-testid="button-admin-login"
            >
              Sign In
            </Button>
          </form>
        </div>

        <button
          onClick={() => setLocation("/")}
          className="mt-6 flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors"
          data-testid="link-back-home"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </button>

        {!ADMIN_PASSWORD && (
          <div className="mt-5 rounded-lg bg-amber-900/30 border border-amber-800/50 px-4 py-3 text-xs text-amber-400 text-center">
            <strong>Dev mode:</strong> Set <code>VITE_ADMIN_PASSWORD</code> in Replit Secrets to enable login.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stats Cards ────────────────────────────────────────────────────────────── */
function StatCard({ title, value, icon, sub }: { title: string; value: number | string; icon: React.ReactNode; sub?: string }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-green-400">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ─── Lead Row (desktop table) ───────────────────────────────────────────────── */
function LeadTableRow({
  lead, token, onStatusChange
}: { lead: Lead; token: string; onStatusChange: (idx: number, s: LeadStatus) => void }) {
  const [updating, setUpdating] = useState(false);

  async function handleStatus(val: string) {
    const s = val as LeadStatus;
    setUpdating(true);
    try {
      await updateLeadStatus(token, lead.rowIndex, s);
      onStatusChange(lead.rowIndex, s);
    } catch { /* silent — optimistic UI already reverted by parent */ }
    finally { setUpdating(false); }
  }

  const waMsg = encodeURIComponent(`Hi ${lead.fullName}, this is StockSense team. We saw your enquiry and would love to connect. Is this a good time?`);

  return (
    <TableRow className="border-slate-800 hover:bg-slate-800/50" data-testid={`lead-row-${lead.rowIndex}`}>
      <TableCell className="py-3">
        <div>
          <p className="font-semibold text-white text-sm">{lead.fullName}</p>
          <p className="text-slate-500 text-xs">{lead.city}</p>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <p className="text-slate-200 text-sm">{lead.mobile}</p>
      </TableCell>
      <TableCell className="py-3 hidden md:table-cell">
        <p className="text-slate-400 text-xs">{lead.experience}</p>
      </TableCell>
      <TableCell className="py-3 hidden lg:table-cell">
        <p className="text-slate-400 text-xs">{lead.contactTime}</p>
      </TableCell>
      <TableCell className="py-3 hidden xl:table-cell max-w-[200px]">
        <p className="text-slate-400 text-xs truncate" title={lead.intent}>{lead.intent}</p>
      </TableCell>
      <TableCell className="py-3 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">
        {lead.timestamp}
      </TableCell>
      <TableCell className="py-3">
        <Select
          value={lead.status}
          onValueChange={handleStatus}
          disabled={updating}
        >
          <SelectTrigger
            className="h-7 w-[120px] text-xs border-0 bg-transparent p-0 focus:ring-0 gap-1"
            data-testid={`select-status-${lead.rowIndex}`}
          >
            <StatusBadge status={lead.status} />
            {updating ? <Loader2 className="h-3 w-3 animate-spin text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            {(["New","Contacted","Follow-up","Converted"] as LeadStatus[]).map(s => (
              <SelectItem key={s} value={s} className="text-slate-200 focus:bg-slate-800 focus:text-white text-xs">
                <StatusBadge status={s} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${lead.mobile.replace(/\D/g,"")}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            data-testid={`button-whatsapp-${lead.rowIndex}`}
          >
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-900/30">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </a>
          <a href={`tel:${lead.mobile}`} title="Call" data-testid={`button-call-${lead.rowIndex}`}>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30">
              <Phone className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ─── Lead Card (mobile list) ────────────────────────────────────────────────── */
function LeadCard({
  lead, token, onStatusChange
}: { lead: Lead; token: string; onStatusChange: (idx: number, s: LeadStatus) => void }) {
  const [updating, setUpdating] = useState(false);

  async function handleStatus(val: string) {
    const s = val as LeadStatus;
    setUpdating(true);
    try {
      await updateLeadStatus(token, lead.rowIndex, s);
      onStatusChange(lead.rowIndex, s);
    } catch { }
    finally { setUpdating(false); }
  }

  const waMsg = encodeURIComponent(`Hi ${lead.fullName}, this is StockSense team. We saw your enquiry and would love to connect.`);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3" data-testid={`lead-card-${lead.rowIndex}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{lead.fullName}</p>
          <p className="text-slate-400 text-sm">{lead.mobile} · {lead.city}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <p className="text-slate-500 text-xs">{lead.experience} · {lead.contactTime}</p>
      {lead.intent && <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{lead.intent}</p>}
      <p className="text-slate-600 text-xs">{lead.timestamp}</p>

      <div className="flex items-center justify-between pt-1">
        <Select value={lead.status} onValueChange={handleStatus} disabled={updating}>
          <SelectTrigger className="h-8 w-[140px] text-xs bg-slate-800 border-slate-700 text-slate-300">
            <SelectValue />
            {updating && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            {(["New","Contacted","Follow-up","Converted"] as LeadStatus[]).map(s => (
              <SelectItem key={s} value={s} className="text-slate-200 focus:bg-slate-800 text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <a
            href={`https://wa.me/${lead.mobile.replace(/\D/g,"")}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            data-testid={`button-whatsapp-card-${lead.rowIndex}`}
          >
            <Button size="sm" className="h-8 bg-green-700 hover:bg-green-600 text-white gap-1.5 text-xs">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
          </a>
          <a href={`tel:${lead.mobile}`} data-testid={`button-call-card-${lead.rowIndex}`}>
            <Button size="sm" variant="outline" className="h-8 border-slate-700 text-slate-300 hover:text-white gap-1.5 text-xs">
              <Phone className="h-3.5 w-3.5" /> Call
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Page ────────────────────────────────────────────────────────── */
export default function Admin() {
  const [, setLocation] = useLocation();

  // Auth state
  const [token,    setToken]    = useState<string | null>(() => sessionStorage.getItem(ADMIN_SESSION));
  const [authed,   setAuthed]   = useState(() => !!sessionStorage.getItem(ADMIN_SESSION));

  // Data state
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Filter state
  const [searchName,   setSearchName]   = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");

  function handleLogin(pass: string): boolean {
    // If ADMIN_PASSWORD env is not set, allow any non-empty password in dev
    const valid = ADMIN_PASSWORD ? pass === ADMIN_PASSWORD : pass.length > 0;
    if (!valid) return false;
    sessionStorage.setItem(ADMIN_SESSION, pass);
    setToken(pass);
    setAuthed(true);
    return true;
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION);
    setToken(null);
    setAuthed(false);
    setLeads([]);
  }

  async function loadLeads() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeads(token);
      setLeads(data);
      setLastSync(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed && token) loadLeads();
  }, [authed]);

  function handleStatusChange(rowIndex: number, status: LeadStatus) {
    setLeads(prev => prev.map(l => l.rowIndex === rowIndex ? { ...l, status } : l));
  }

  // Filtered leads
  const filtered = useMemo(() => {
    return leads.filter(l => {
      const nameMatch   = l.fullName.toLowerCase().includes(searchName.toLowerCase());
      const mobileMatch = l.mobile.includes(searchMobile.replace(/\s/g,""));
      const statusMatch = statusFilter === "all" || l.status === statusFilter;
      return nameMatch && mobileMatch && statusMatch;
    });
  }, [leads, searchName, searchMobile, statusFilter]);

  const stats = useMemo(() => computeStats(leads), [leads]);

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">StockSense Admin</h1>
              {lastSync && (
                <p className="text-xs text-slate-500 leading-none mt-0.5">
                  Synced {lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={loadLeads}
              disabled={loading}
              className="h-8 text-slate-400 hover:text-white gap-1.5"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportCSV(filtered)}
              disabled={filtered.length === 0}
              className="h-8 text-slate-400 hover:text-white gap-1.5"
              data-testid="button-export-csv"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLocation("/")}
              className="h-8 text-slate-400 hover:text-white gap-1.5"
              data-testid="button-view-site"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Site</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="h-8 text-slate-400 hover:text-red-400 gap-1.5"
              data-testid="button-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-900/30 border border-red-800/50 px-5 py-4 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Could not load leads:</strong> {error}
              {!APPS_SCRIPT_URL && (
                <p className="mt-1 text-red-400 text-xs">
                  <code>VITE_APPS_SCRIPT_URL</code> is not set — showing mock data. Set it in Replit Secrets.
                </p>
              )}
            </div>
          </div>
        )}

        {!APPS_SCRIPT_URL && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-900/30 border border-amber-800/50 px-5 py-3 text-xs text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Demo mode</strong> — set <code>VITE_APPS_SCRIPT_URL</code> + <code>VITE_ADMIN_PASSWORD</code> in Replit Secrets to connect your Google Sheet.
            </span>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Leads"     value={stats.total}     icon={<Users    className="h-4 w-4" />} sub="All time" />
          <StatCard title="Today"           value={stats.today}     icon={<Calendar className="h-4 w-4" />} sub="New today" />
          <StatCard title="This Week"       value={stats.weekly}    icon={<TrendingUp className="h-4 w-4" />} sub="Last 7 days" />
          <StatCard title="Converted"       value={stats.converted} icon={<CheckCircle2 className="h-4 w-4" />} sub="All time" />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input
              placeholder="Search by name…"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="pl-9 h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
              data-testid="input-search-name"
            />
          </div>
          <div className="relative flex-1 sm:max-w-[200px]">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input
              placeholder="Search by mobile…"
              value={searchMobile}
              onChange={e => setSearchMobile(e.target.value)}
              className="pl-9 h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
              data-testid="input-search-mobile"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger
              className="h-10 w-full sm:w-[150px] bg-slate-900 border-slate-700 text-slate-300"
              data-testid="select-filter-status"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all"       className="text-slate-200 focus:bg-slate-800">All Statuses</SelectItem>
              <SelectItem value="New"       className="text-slate-200 focus:bg-slate-800">New</SelectItem>
              <SelectItem value="Contacted" className="text-slate-200 focus:bg-slate-800">Contacted</SelectItem>
              <SelectItem value="Follow-up" className="text-slate-200 focus:bg-slate-800">Follow-up</SelectItem>
              <SelectItem value="Converted" className="text-slate-200 focus:bg-slate-800">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Result count ── */}
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            {loading
              ? "Loading…"
              : `${filtered.length} lead${filtered.length !== 1 ? "s" : ""}${filtered.length !== leads.length ? ` (filtered from ${leads.length})` : ""}`
            }
          </p>
          {leads.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportCSV(filtered)}
              className="h-7 text-xs text-slate-400 hover:text-white gap-1.5 sm:hidden"
            >
              <Download className="h-3 w-3" /> Export
            </Button>
          )}
        </div>

        {/* ── Desktop Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading leads from Google Sheet…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <Users className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-base font-medium">No leads found</p>
            <p className="text-sm mt-1">
              {leads.length === 0 ? "Submit the homepage form to generate your first lead." : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table (hidden on small screens) */}
            <div className="hidden md:block rounded-xl border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3">Name / City</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3">Mobile</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3 hidden md:table-cell">Experience</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Best Time</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Intent</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Timestamp</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3">Status</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(lead => (
                    <LeadTableRow
                      key={lead.rowIndex}
                      lead={lead}
                      token={token!}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards (hidden on md+) */}
            <div className="md:hidden space-y-3">
              {filtered.map(lead => (
                <LeadCard
                  key={lead.rowIndex}
                  lead={lead}
                  token={token!}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
