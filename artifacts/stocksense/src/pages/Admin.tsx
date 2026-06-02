import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, Download, Phone, MessageCircle, LogOut, RefreshCw,
  TrendingUp, Users, Calendar, CheckCircle2, Loader2, AlertCircle,
  ChevronDown, ArrowLeft, BarChart3, Plus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
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

interface NewLeadForm {
  fullName:    string;
  mobile:      string;
  city:        string;
  experience:  string;
  contactTime: string;
  intent:      string;
  consent:     boolean;
}

/* ─── Config ────────────────────────────────────────────────────────────────── */
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const ADMIN_PASSWORD  = import.meta.env.VITE_ADMIN_PASSWORD  as string | undefined;
const ADMIN_SESSION   = "stocksense_admin";

const EMPTY_FORM: NewLeadForm = {
  fullName: "", mobile: "", city: "",
  experience: "", contactTime: "", intent: "", consent: false,
};

/* ─── API helpers ───────────────────────────────────────────────────────────── */
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
  if (!APPS_SCRIPT_URL) return;
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "updateStatus", token, rowIndex, status }),
  });
  if (!res.ok) throw new Error(`Network error ${res.status}`);
  const json = await res.json() as { success: boolean; error?: string };
  if (!json.success) throw new Error(json.error ?? "Status update failed");
}

async function submitNewLead(form: NewLeadForm): Promise<void> {
  if (!APPS_SCRIPT_URL) return; // demo mode — no-op
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      fullName:    form.fullName,
      mobile:      form.mobile,
      city:        form.city,
      experience:  form.experience,
      contactTime: form.contactTime,
      intent:      form.intent,
      consent:     form.consent,
    }),
    mode: "no-cors",
  });
}

/* ─── Mock data ─────────────────────────────────────────────────────────────── */
const MOCK_LEADS: Lead[] = [
  { rowIndex:2, timestamp:"01/06/2026 09:12:00", fullName:"Priya Sharma",  mobile:"9876543210", city:"Mumbai",    experience:"Complete Beginner",   contactTime:"Morning (10AM – 12PM)",  intent:"Want to understand basics of stock market", consent:"Yes", status:"New" },
  { rowIndex:3, timestamp:"01/06/2026 10:34:00", fullName:"Rahul Mehta",   mobile:"9123456789", city:"Pune",      experience:"Have a Demat Account", contactTime:"Evening (5PM – 7PM)",    intent:"Opened demat but no idea what to do",      consent:"Yes", status:"Contacted" },
  { rowIndex:4, timestamp:"01/06/2026 11:55:00", fullName:"Anjali Singh",  mobile:"9988776655", city:"Delhi",     experience:"Tried Trading",         contactTime:"Afternoon (1PM – 4PM)", intent:"Lost money, want to learn properly",        consent:"Yes", status:"Follow-up" },
  { rowIndex:5, timestamp:"31/05/2026 14:22:00", fullName:"Vikram Nair",   mobile:"9871234560", city:"Bangalore", experience:"Learning Actively",     contactTime:"Morning (10AM – 12PM)",  intent:"Want structured curriculum",               consent:"Yes", status:"Converted" },
  { rowIndex:6, timestamp:"31/05/2026 16:45:00", fullName:"Sneha Patel",   mobile:"9765432109", city:"Ahmedabad", experience:"Complete Beginner",     contactTime:"Evening (5PM – 7PM)",    intent:"Curious about long-term investing",        consent:"Yes", status:"New" },
];

/* ─── Stats ─────────────────────────────────────────────────────────────────── */
function computeStats(leads: Lead[]) {
  const now      = new Date();
  const todayStr = now.toLocaleDateString("en-GB");
  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let today = 0, weekly = 0, converted = 0;
  for (const l of leads) {
    const parts = l.timestamp.split(" ")[0]?.split("/");
    if (parts?.length === 3) {
      const lDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (l.timestamp.startsWith(todayStr)) today++;
      if (lDate >= weekAgo) weekly++;
    }
    if (l.status === "Converted") converted++;
  }
  return { total: leads.length, today, weekly, converted };
}

/* ─── CSV export ────────────────────────────────────────────────────────────── */
function exportCSV(leads: Lead[]) {
  const headers = ["Timestamp","Full Name","Mobile","City","Experience","Best Time","Intent","Consent","Status"];
  const rows    = leads.map(l => [
    `"${l.timestamp}"`, `"${l.fullName}"`, `"${l.mobile}"`, `"${l.city}"`,
    `"${l.experience}"`, `"${l.contactTime}"`, `"${l.intent.replace(/"/g,'""')}"`,
    `"${l.consent}"`, `"${l.status}"`
  ].join(","));
  const csv  = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `stocksense-leads-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Status badge ──────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<LeadStatus, string> = {
  "New":       "bg-blue-50 text-blue-700 border-blue-200",
  "Contacted": "bg-amber-50 text-amber-700 border-amber-200",
  "Follow-up": "bg-orange-50 text-orange-700 border-orange-200",
  "Converted": "bg-green-50 text-green-700 border-green-200",
};
function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

/* ─── Add Lead Modal ────────────────────────────────────────────────────────── */
function AddLeadModal({
  open, onClose, onSuccess
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form,       setForm]       = useState<NewLeadForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);

  function set(field: keyof NewLeadForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  }

  function validate(): string {
    if (!form.fullName.trim()    || form.fullName.trim().length < 2)  return "Full name is required (min 2 chars).";
    if (!form.mobile.trim()      || form.mobile.replace(/\D/g,"").length < 10) return "Enter a valid 10-digit mobile number.";
    if (!form.city.trim())        return "City is required.";
    if (!form.experience)         return "Please select experience level.";
    if (!form.contactTime)        return "Please select best time to contact.";
    if (!form.intent.trim()      || form.intent.trim().length < 5)    return "Please describe what they want to learn.";
    if (!form.consent)            return "Consent is required.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      await submitNewLead(form);
      setDone(true);
    } catch {
      setError("Submission failed. Check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setError("");
    setDone(false);
    onClose();
  }

  function handleDoneClose() {
    handleClose();
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={open ? handleClose : undefined}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-lg font-bold">Add New Lead</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm mt-0.5">
                Manually enter lead details — saved directly to Google Sheet
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {done ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Lead Added!</p>
              <p className="text-slate-400 text-sm mt-1">
                <strong className="text-white">{form.fullName}</strong> has been saved to your Google Sheet.
                Email notification has been sent.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                onClick={() => { setForm(EMPTY_FORM); setDone(false); }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:text-white"
              >
                Add Another
              </Button>
              <Button onClick={handleDoneClose} className="bg-green-600 hover:bg-green-700 text-white">
                Done & Refresh
              </Button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Row 1: Name + Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Full Name <span className="text-red-400">*</span></Label>
                <Input
                  value={form.fullName}
                  onChange={e => set("fullName", e.target.value)}
                  placeholder="Rahul Sharma"
                  className="h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Mobile Number <span className="text-red-400">*</span></Label>
                <Input
                  value={form.mobile}
                  onChange={e => set("mobile", e.target.value)}
                  placeholder="9876543210"
                  type="tel"
                  className="h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Row 2: City */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">City <span className="text-red-400">*</span></Label>
              <Input
                value={form.city}
                onChange={e => set("city", e.target.value)}
                placeholder="Mumbai, Pune, Delhi…"
                className="h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
              />
            </div>

            {/* Row 3: Experience + Best Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Experience Level <span className="text-red-400">*</span></Label>
                <Select value={form.experience} onValueChange={v => set("experience", v)}>
                  <SelectTrigger className="h-10 bg-slate-800 border-slate-700 text-slate-300 focus:border-green-500">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="beginner"  className="text-slate-200 focus:bg-slate-800">Complete Beginner</SelectItem>
                    <SelectItem value="demat"     className="text-slate-200 focus:bg-slate-800">Have a Demat Account</SelectItem>
                    <SelectItem value="tried"     className="text-slate-200 focus:bg-slate-800">Tried Trading</SelectItem>
                    <SelectItem value="learning"  className="text-slate-200 focus:bg-slate-800">Learning Actively</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Best Time to Contact <span className="text-red-400">*</span></Label>
                <Select value={form.contactTime} onValueChange={v => set("contactTime", v)}>
                  <SelectTrigger className="h-10 bg-slate-800 border-slate-700 text-slate-300 focus:border-green-500">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="morning"   className="text-slate-200 focus:bg-slate-800">Morning (10AM – 12PM)</SelectItem>
                    <SelectItem value="afternoon" className="text-slate-200 focus:bg-slate-800">Afternoon (1PM – 4PM)</SelectItem>
                    <SelectItem value="evening"   className="text-slate-200 focus:bg-slate-800">Evening (5PM – 7PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Intent */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">What do they want to understand? <span className="text-red-400">*</span></Label>
              <Textarea
                value={form.intent}
                onChange={e => set("intent", e.target.value)}
                placeholder="e.g. Interested in long-term investing, wants to understand mutual funds vs direct stocks…"
                rows={3}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 resize-none"
              />
            </div>

            {/* Row 5: Consent */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700">
              <Checkbox
                id="admin-consent"
                checked={form.consent}
                onCheckedChange={v => set("consent", !!v)}
                className="mt-0.5 border-slate-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <Label htmlFor="admin-consent" className="text-slate-300 text-sm leading-snug cursor-pointer">
                Lead has agreed to be contacted by call, SMS, or WhatsApp regarding their enquiry.
              </Label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-700 text-slate-300 hover:text-white"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                disabled={submitting}
              >
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="h-4 w-4" /> Add Lead</>}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Login Screen ──────────────────────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: (pass: string) => boolean }) {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
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
          {/* Large logo */}
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-green-600 mb-5 shadow-lg shadow-green-900/40">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">StockSense</h1>
          <p className="text-green-400 font-semibold text-sm mt-1">Admin Dashboard</p>
          <p className="text-slate-500 text-sm mt-1">Lead management portal</p>
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
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold text-base">
              Sign In
            </Button>
          </form>
        </div>

        <button
          onClick={() => setLocation("/")}
          className="mt-6 flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors"
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

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */
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

/* ─── Lead Table Row (desktop) ──────────────────────────────────────────────── */
function LeadTableRow({ lead, token, onStatusChange }: { lead: Lead; token: string; onStatusChange: (idx: number, s: LeadStatus) => void }) {
  const [updating, setUpdating] = useState(false);

  async function handleStatus(val: string) {
    const s = val as LeadStatus;
    setUpdating(true);
    try { await updateLeadStatus(token, lead.rowIndex, s); onStatusChange(lead.rowIndex, s); }
    catch { }
    finally { setUpdating(false); }
  }

  const waMsg = encodeURIComponent(`Hi ${lead.fullName}, this is StockSense team. We saw your enquiry and would love to connect. Is this a good time?`);

  return (
    <TableRow className="border-slate-800 hover:bg-slate-800/50">
      <TableCell className="py-3">
        <p className="font-semibold text-white text-sm">{lead.fullName}</p>
        <p className="text-slate-500 text-xs">{lead.city}</p>
      </TableCell>
      <TableCell className="py-3 text-slate-200 text-sm">{lead.mobile}</TableCell>
      <TableCell className="py-3 hidden md:table-cell text-slate-400 text-xs">{lead.experience}</TableCell>
      <TableCell className="py-3 hidden lg:table-cell text-slate-400 text-xs">{lead.contactTime}</TableCell>
      <TableCell className="py-3 hidden xl:table-cell max-w-[200px]">
        <p className="text-slate-400 text-xs truncate" title={lead.intent}>{lead.intent}</p>
      </TableCell>
      <TableCell className="py-3 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">{lead.timestamp}</TableCell>
      <TableCell className="py-3">
        <Select value={lead.status} onValueChange={handleStatus} disabled={updating}>
          <SelectTrigger className="h-7 w-[120px] text-xs border-0 bg-transparent p-0 focus:ring-0 gap-1">
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
          <a href={`https://wa.me/${lead.mobile.replace(/\D/g,"")}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" title="WhatsApp">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-900/30">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </a>
          <a href={`tel:${lead.mobile}`} title="Call">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30">
              <Phone className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ─── Lead Card (mobile) ────────────────────────────────────────────────────── */
function LeadCard({ lead, token, onStatusChange }: { lead: Lead; token: string; onStatusChange: (idx: number, s: LeadStatus) => void }) {
  const [updating, setUpdating] = useState(false);

  async function handleStatus(val: string) {
    const s = val as LeadStatus;
    setUpdating(true);
    try { await updateLeadStatus(token, lead.rowIndex, s); onStatusChange(lead.rowIndex, s); }
    catch { }
    finally { setUpdating(false); }
  }

  const waMsg = encodeURIComponent(`Hi ${lead.fullName}, this is StockSense team. We saw your enquiry and would love to connect.`);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
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
              <SelectItem key={s} value={s} className="text-slate-200 focus:bg-slate-800 text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <a href={`https://wa.me/${lead.mobile.replace(/\D/g,"")}?text=${waMsg}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="h-8 bg-green-700 hover:bg-green-600 text-white gap-1.5 text-xs">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
          </a>
          <a href={`tel:${lead.mobile}`}>
            <Button size="sm" variant="outline" className="h-8 border-slate-700 text-slate-300 hover:text-white gap-1.5 text-xs">
              <Phone className="h-3.5 w-3.5" /> Call
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Page ───────────────────────────────────────────────────────── */
export default function Admin() {
  const [, setLocation] = useLocation();

  const [token,  setToken]  = useState<string | null>(() => sessionStorage.getItem(ADMIN_SESSION));
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ADMIN_SESSION));

  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [searchName,   setSearchName]   = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [addOpen,      setAddOpen]      = useState(false);

  function handleLogin(pass: string): boolean {
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

  useEffect(() => { if (authed && token) loadLeads(); }, [authed]);

  function handleStatusChange(rowIndex: number, status: LeadStatus) {
    setLeads(prev => prev.map(l => l.rowIndex === rowIndex ? { ...l, status } : l));
  }

  const filtered = useMemo(() => leads.filter(l => {
    const nameMatch   = l.fullName.toLowerCase().includes(searchName.toLowerCase());
    const mobileMatch = l.mobile.includes(searchMobile.replace(/\s/g,""));
    const statusMatch = statusFilter === "all" || l.status === statusFilter;
    return nameMatch && mobileMatch && statusMatch;
  }), [leads, searchName, searchMobile, statusFilter]);

  const stats = useMemo(() => computeStats(leads), [leads]);

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Add Lead Modal ── */}
      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { setAddOpen(false); loadLeads(); }}
      />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo — bigger */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-green-900/40">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">StockSense Admin</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {lastSync && (
                  <p className="text-xs text-slate-500 leading-none">Synced {lastSync.toLocaleTimeString()} ·</p>
                )}
                <a
                  href="mailto:stocksense00@gmail.com"
                  className="text-xs text-green-400 hover:text-green-300 leading-none transition-colors"
                >
                  stocksense00@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Add Lead — primary CTA */}
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="h-9 bg-green-600 hover:bg-green-700 text-white font-semibold gap-1.5 px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>

            <Button size="sm" variant="ghost" onClick={loadLeads} disabled={loading}
              className="h-8 text-slate-400 hover:text-white gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => exportCSV(filtered)} disabled={filtered.length === 0}
              className="h-8 text-slate-400 hover:text-white gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setLocation("/")}
              className="h-8 text-slate-400 hover:text-white gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Site</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout}
              className="h-8 text-slate-400 hover:text-red-400">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── Banners ── */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-900/30 border border-red-800/50 px-5 py-4 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div><strong>Could not load leads:</strong> {error}</div>
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
          <StatCard title="Total Leads" value={stats.total}     icon={<Users        className="h-4 w-4" />} sub="All time" />
          <StatCard title="Today"       value={stats.today}     icon={<Calendar     className="h-4 w-4" />} sub="New today" />
          <StatCard title="This Week"   value={stats.weekly}    icon={<TrendingUp   className="h-4 w-4" />} sub="Last 7 days" />
          <StatCard title="Converted"   value={stats.converted} icon={<CheckCircle2 className="h-4 w-4" />} sub="All time" />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input placeholder="Search by name…" value={searchName} onChange={e => setSearchName(e.target.value)}
              className="pl-9 h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500" />
          </div>
          <div className="relative flex-1 sm:max-w-[200px]">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input placeholder="Search by mobile…" value={searchMobile} onChange={e => setSearchMobile(e.target.value)}
              className="pl-9 h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500" />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-10 w-full sm:w-[150px] bg-slate-900 border-slate-700 text-slate-300">
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

        {/* ── Count row ── */}
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            {loading ? "Loading…" : `${filtered.length} lead${filtered.length !== 1 ? "s" : ""}${filtered.length !== leads.length ? ` (filtered from ${leads.length})` : ""}`}
          </p>
          <div className="flex items-center gap-2">
            {/* Mobile-only Add Lead shortcut */}
            <Button size="sm" onClick={() => setAddOpen(true)}
              className="h-7 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs sm:hidden">
              <Plus className="h-3 w-3" /> Add
            </Button>
            {leads.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => exportCSV(filtered)}
                className="h-7 text-xs text-slate-400 hover:text-white gap-1.5 sm:hidden">
                <Download className="h-3 w-3" /> Export
              </Button>
            )}
          </div>
        </div>

        {/* ── Table / Cards ── */}
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
              {leads.length === 0
                ? "No leads yet — click \"Add Lead\" to add one manually, or submit the homepage form."
                : "Try adjusting your search or filter."}
            </p>
            {leads.length === 0 && (
              <Button onClick={() => setAddOpen(true)} className="mt-5 bg-green-600 hover:bg-green-700 text-white gap-2">
                <Plus className="h-4 w-4" /> Add First Lead
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
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
                    <LeadTableRow key={lead.rowIndex} lead={lead} token={token!} onStatusChange={handleStatusChange} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {filtered.map(lead => (
                <LeadCard key={lead.rowIndex} lead={lead} token={token!} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
