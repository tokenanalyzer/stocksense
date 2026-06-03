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
  rowIndex:          number;
  timestamp:         string;
  fullName:          string;
  mobile:            string;
  investmentCapital: string;
  dematStatus:       string;
  dematAccount:      string;
  dematAccountOther: string;
  city:              string;
  experience:        string;
  contactTime:       string;
  intent:            string;
  consent:           string;
  status:            LeadStatus;
}

interface NewLeadForm {
  fullName:          string;
  mobile:            string;
  investmentCapital: string;
  dematStatus:       string;
  dematAccount:      string;
  dematAccountOther: string;
  city:              string;
  experience:        string;
  contactTime:       string;
  intent:            string;
  consent:           boolean;
}

/* ─── Config ────────────────────────────────────────────────────────────────── */
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const ADMIN_PASSWORD  = import.meta.env.VITE_ADMIN_PASSWORD  as string | undefined;
const ADMIN_SESSION   = "stocksense_admin";

const EMPTY_FORM: NewLeadForm = {
  fullName: "", mobile: "", investmentCapital: "",
  dematStatus: "", dematAccount: "", dematAccountOther: "",
  city: "", experience: "", contactTime: "", intent: "", consent: false,
};

const DEMAT_ACCOUNTS_ADMIN = [
  "Zerodha","Groww","Angel One","Upstox","ICICI Direct","HDFC Securities",
  "Kotak Securities","Motilal Oswal","Sharekhan","Dhan","FYERS","5Paisa",
  "Paytm Money","Alice Blue","Other"
] as const;

/* ─── API helpers ───────────────────────────────────────────────────────────── */
async function fetchLeads(token: string): Promise<Lead[]> {
  if (!APPS_SCRIPT_URL) return MOCK_LEADS;
  const url = `${APPS_SCRIPT_URL}?action=getLeads&token=${encodeURIComponent(token)}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("NETWORK_ERROR");
  }
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  let json: Record<string, unknown>;
  try {
    json = await res.json() as Record<string, unknown>;
  } catch {
    throw new Error("SCRIPT_OUTDATED");
  }
  // Detect outdated script: returns health-check shape instead of {success, leads}
  if ("status" in json && !("success" in json)) {
    throw new Error("SCRIPT_OUTDATED");
  }
  if (!json.success) {
    const msg = json.error as string | undefined;
    if (msg === "Unauthorized") throw new Error("UNAUTHORIZED");
    throw new Error(msg ?? "SCRIPT_OUTDATED");
  }
  return (json.leads as Lead[]) ?? [];
}

async function updateLeadStatus(token: string, rowIndex: number, status: LeadStatus): Promise<void> {
  if (!APPS_SCRIPT_URL) return;
  // Google Apps Script does not return CORS headers, so we use no-cors.
  // The POST reaches and executes doPost() correctly (confirmed via getLeads after POST).
  // We cannot read the response — optimistic UI update is applied by the caller.
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "updateStatus", token, rowIndex, status }),
    mode: "no-cors",
  });
}

async function submitNewLead(form: NewLeadForm): Promise<void> {
  if (!APPS_SCRIPT_URL) return; // demo mode — no-op
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      fullName:          form.fullName,
      mobile:            form.mobile,
      investmentCapital: form.investmentCapital ? Number(form.investmentCapital) : "",
      dematStatus:       form.dematStatus,
      dematAccount:      form.dematAccount,
      dematAccountOther: form.dematAccountOther,
      city:              form.city,
      experience:        form.experience,
      contactTime:       form.contactTime,
      intent:            form.intent,
      consent:           form.consent,
    }),
    mode: "no-cors",
  });
}

type ScriptCheckStatus = "unchecked" | "checking" | "ok" | "wrong_version" | "error";

async function checkScriptHealth(): Promise<{ status: ScriptCheckStatus; version?: string; detail?: string }> {
  if (!APPS_SCRIPT_URL) return { status: "error", detail: "VITE_APPS_SCRIPT_URL not set" };
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
    const json = await res.json() as Record<string, unknown>;
    if (!json.success) return { status: "error", detail: "Script returned success:false on health check" };
    const version = json.version as string | undefined;
    if (version === "4" || version === "3") return { status: "ok", version };
    return { status: "wrong_version", version: version ?? "unknown (pre-v3)" };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

/* ─── Mock data ─────────────────────────────────────────────────────────────── */
const MOCK_LEADS: Lead[] = [
  { rowIndex:2, timestamp:"01/06/2026 09:12:00", fullName:"Priya Sharma",  mobile:"9876543210", investmentCapital:"50000",  dematStatus:"Yes",        dematAccount:"Zerodha",   dematAccountOther:"", city:"Mumbai",    experience:"Complete Beginner",   contactTime:"Morning (10AM – 12PM)",  intent:"Want to understand basics of stock market", consent:"Yes", status:"New" },
  { rowIndex:3, timestamp:"01/06/2026 10:34:00", fullName:"Rahul Mehta",   mobile:"9123456789", investmentCapital:"100000", dematStatus:"Yes",        dematAccount:"Groww",     dematAccountOther:"", city:"Pune",      experience:"Have a Demat Account", contactTime:"Evening (5PM – 7PM)",    intent:"Opened demat but no idea what to do",      consent:"Yes", status:"Contacted" },
  { rowIndex:4, timestamp:"01/06/2026 11:55:00", fullName:"Anjali Singh",  mobile:"9988776655", investmentCapital:"25000",  dematStatus:"In Process", dematAccount:"",          dematAccountOther:"", city:"Delhi",     experience:"Tried Trading",         contactTime:"Afternoon (1PM – 4PM)", intent:"Lost money, want to learn properly",        consent:"Yes", status:"Follow-up" },
  { rowIndex:5, timestamp:"31/05/2026 14:22:00", fullName:"Vikram Nair",   mobile:"9871234560", investmentCapital:"200000", dematStatus:"Yes",        dematAccount:"Angel One", dematAccountOther:"", city:"Bangalore", experience:"Learning Actively",     contactTime:"Morning (10AM – 12PM)",  intent:"Want structured curriculum",               consent:"Yes", status:"Converted" },
  { rowIndex:6, timestamp:"31/05/2026 16:45:00", fullName:"Sneha Patel",   mobile:"9765432109", investmentCapital:"10000",  dematStatus:"No",         dematAccount:"",          dematAccountOther:"", city:"Ahmedabad", experience:"Complete Beginner",     contactTime:"Evening (5PM – 7PM)",    intent:"Curious about long-term investing",        consent:"Yes", status:"New" },
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

/* ─── Capital formatter (Indian locale) ─────────────────────────────────────── */
function formatCapital(val: string | number | undefined): string {
  if (val === "" || val == null) return "—";
  const num = typeof val === "number" ? val : parseInt(String(val), 10);
  if (isNaN(num)) return String(val) || "—";
  return "₹" + num.toLocaleString("en-IN");
}

/* ─── CSV export ────────────────────────────────────────────────────────────── */
function exportCSV(leads: Lead[]) {
  const headers = [
    "Timestamp","Full Name","Mobile",
    "Investment Capital","Demat Status","Demat Account","Demat Account Other",
    "City","Experience","Best Time","Intent","Consent","Status"
  ];
  const rows = leads.map(l => [
    `"${l.timestamp}"`, `"${l.fullName}"`, `"${l.mobile}"`,
    `"${l.investmentCapital}"`, `"${l.dematStatus}"`, `"${l.dematAccount}"`, `"${l.dematAccountOther}"`,
    `"${l.city}"`, `"${l.experience}"`, `"${l.contactTime}"`,
    `"${(l.intent || "").replace(/"/g,'""')}"`,
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
    if (!form.fullName.trim() || form.fullName.trim().length < 2) return "Full name is required (min 2 chars).";
    if (!form.mobile.trim()   || form.mobile.replace(/\D/g,"").length < 10) return "Enter a valid 10-digit mobile number.";
    if (!form.investmentCapital || !/^\d+$/.test(form.investmentCapital)) return "Enter a valid investment capital amount (digits only).";
    if (!form.dematStatus)    return "Please select Demat account status.";
    if (!form.city.trim())    return "City is required.";
    if (!form.experience)     return "Please select experience level.";
    if (!form.contactTime)    return "Please select best time to contact.";
    if (!form.consent)        return "Consent is required.";
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

            {/* Row 2: Investment Capital */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Investment Capital (₹) <span className="text-red-400">*</span></Label>
              <Input
                value={form.investmentCapital}
                onChange={e => set("investmentCapital", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 50000"
                inputMode="numeric"
                className="h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
              />
            </div>

            {/* Row 3: Demat Status */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Do They Have a Demat Account? <span className="text-red-400">*</span></Label>
              <Select value={form.dematStatus} onValueChange={v => set("dematStatus", v)}>
                <SelectTrigger className="h-10 bg-slate-800 border-slate-700 text-slate-300 focus:border-green-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="Yes"        className="text-slate-200 focus:bg-slate-800">Yes</SelectItem>
                  <SelectItem value="No"         className="text-slate-200 focus:bg-slate-800">No</SelectItem>
                  <SelectItem value="In Process" className="text-slate-200 focus:bg-slate-800">In Process</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Demat Account (conditional) */}
            {(form.dematStatus === "Yes" || form.dematStatus === "In Process") && (
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Which Demat Account?</Label>
                <Select value={form.dematAccount} onValueChange={v => set("dematAccount", v)}>
                  <SelectTrigger className="h-10 bg-slate-800 border-slate-700 text-slate-300 focus:border-green-500">
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {DEMAT_ACCOUNTS_ADMIN.map(a => (
                      <SelectItem key={a} value={a} className="text-slate-200 focus:bg-slate-800">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Row 5: Demat Account Other (conditional) */}
            {form.dematAccount === "Other" && (
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Other Demat Account Name</Label>
                <Input
                  value={form.dematAccountOther}
                  onChange={e => set("dematAccountOther", e.target.value)}
                  placeholder="Broker name"
                  className="h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
                />
              </div>
            )}

            {/* Row 6: City */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">City <span className="text-red-400">*</span></Label>
              <Input
                value={form.city}
                onChange={e => set("city", e.target.value)}
                placeholder="Mumbai, Pune, Delhi…"
                className="h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500"
              />
            </div>

            {/* Row 7: Experience + Best Time */}
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

            {/* Row 8: Intent (optional) */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">
                What do they want to understand?{" "}
                <span className="text-slate-500 font-normal text-xs">(Optional)</span>
              </Label>
              <Textarea
                value={form.intent}
                onChange={e => set("intent", e.target.value)}
                placeholder="e.g. Interested in long-term investing, wants to understand mutual funds vs direct stocks…"
                rows={3}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 resize-none"
              />
            </div>

            {/* Row 9: Consent */}
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
  const [updating,  setUpdating]  = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  async function handleStatus(val: string) {
    const s = val as LeadStatus;
    setUpdating(true);
    try { await updateLeadStatus(token, lead.rowIndex, s); onStatusChange(lead.rowIndex, s); }
    catch { }
    finally { setUpdating(false); }
  }

  const waMsg = encodeURIComponent(`Hi ${lead.fullName}, this is StockSense team. We saw your enquiry and would love to connect. Is this a good time?`);

  return (
    <>
      <LeadDetailDialog lead={lead} open={detailOpen} onClose={() => setDetailOpen(false)} />
      <TableRow className="border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => setDetailOpen(true)}>
        <TableCell className="py-3" onClick={e => e.stopPropagation()}>
          <p className="font-semibold text-white text-sm">{lead.fullName}</p>
          <p className="text-slate-500 text-xs">{lead.city}</p>
        </TableCell>
        <TableCell className="py-3 text-slate-200 text-sm">{lead.mobile}</TableCell>
        <TableCell className="py-3 hidden md:table-cell text-slate-300 text-xs font-medium">{formatCapital(lead.investmentCapital)}</TableCell>
        <TableCell className="py-3 hidden lg:table-cell text-slate-400 text-xs">{lead.dematStatus || "—"}</TableCell>
        <TableCell className="py-3 hidden xl:table-cell text-slate-400 text-xs">{lead.experience}</TableCell>
        <TableCell className="py-3 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">{lead.timestamp}</TableCell>
        <TableCell className="py-3" onClick={e => e.stopPropagation()}>
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
        <TableCell className="py-3" onClick={e => e.stopPropagation()}>
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
    </>
  );
}

/* ─── Lead Card (mobile) ────────────────────────────────────────────────────── */
function LeadCard({ lead, token, onStatusChange }: { lead: Lead; token: string; onStatusChange: (idx: number, s: LeadStatus) => void }) {
  const [updating,   setUpdating]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  async function handleStatus(val: string) {
    const s = val as LeadStatus;
    setUpdating(true);
    try { await updateLeadStatus(token, lead.rowIndex, s); onStatusChange(lead.rowIndex, s); }
    catch { }
    finally { setUpdating(false); }
  }

  const waMsg = encodeURIComponent(`Hi ${lead.fullName}, this is StockSense team. We saw your enquiry and would love to connect.`);

  return (
    <>
      <LeadDetailDialog lead={lead} open={detailOpen} onClose={() => setDetailOpen(false)} />
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <button onClick={() => setDetailOpen(true)} className="text-left flex-1">
            <p className="font-semibold text-white hover:text-green-400 transition-colors">{lead.fullName}</p>
            <p className="text-slate-400 text-sm">{lead.mobile} · {lead.city}</p>
          </button>
          <StatusBadge status={lead.status} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {lead.investmentCapital && <span className="text-slate-300 font-medium">{formatCapital(lead.investmentCapital)}</span>}
          {lead.dematStatus && <span>{lead.dematStatus}{lead.dematAccount ? ` · ${lead.dematAccount}` : ""}</span>}
          <span>{lead.experience}</span>
          <span>{lead.contactTime}</span>
        </div>
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
                <MessageCircle className="h-3.5 w-3.5" /> WA
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
    </>
  );
}

/* ─── Lead Detail Dialog ────────────────────────────────────────────────────── */
function LeadDetailDialog({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const waMsg = encodeURIComponent(`Hi ${lead.fullName}, this is StockSense team. We saw your enquiry and would love to connect. Is this a good time?`);
  const rows: [string, string][] = [
    ["Full Name",          lead.fullName],
    ["Mobile",             lead.mobile],
    ["City",               lead.city],
    ["Investment Capital", formatCapital(lead.investmentCapital)],
    ["Demat Status",       lead.dematStatus || "—"],
    ["Demat Account",      lead.dematAccount || "—"],
    ...(lead.dematAccount === "Other" && lead.dematAccountOther ? [["Other Broker", lead.dematAccountOther] as [string,string]] : []),
    ["Experience",         lead.experience],
    ["Best Time",          lead.contactTime],
    ["Intent",             lead.intent || "—"],
    ["Consent",            lead.consent],
    ["Status",             lead.status],
    ["Timestamp",          lead.timestamp],
  ];
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">{lead.fullName}</DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">{lead.mobile} · {lead.city}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm max-h-[60vh] overflow-y-auto pr-1">
          {rows.map(([label, val]) => (
            <div key={label} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
              <span className="text-slate-500 min-w-[140px] shrink-0">{label}</span>
              <span className="text-slate-200 break-words">{val}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
          <a href={`https://wa.me/${lead.mobile.replace(/\D/g,"")}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full h-9 bg-green-700 hover:bg-green-600 text-white gap-2 text-sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </a>
          <a href={`tel:${lead.mobile}`} className="flex-1">
            <Button variant="outline" className="w-full h-9 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-sm">
              <Phone className="h-4 w-4" /> Call
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

  const [scriptCheck,  setScriptCheck]  = useState<ScriptCheckStatus>("unchecked");
  const [scriptDetail, setScriptDetail] = useState<string | undefined>();

  async function handleVerifyScript() {
    setScriptCheck("checking");
    const result = await checkScriptHealth();
    setScriptCheck(result.status);
    setScriptDetail(result.version ?? result.detail);
  }

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
            {/* Script health check button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleVerifyScript}
              disabled={scriptCheck === "checking"}
              className={`h-8 gap-1.5 text-xs font-medium border ${
                scriptCheck === "ok"
                  ? "border-green-700 text-green-400 hover:text-green-300"
                  : scriptCheck === "wrong_version"
                  ? "border-amber-700 text-amber-400 hover:text-amber-300"
                  : scriptCheck === "error"
                  ? "border-red-700 text-red-400 hover:text-red-300"
                  : "border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {scriptCheck === "checking" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : scriptCheck === "ok" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <BarChart3 className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {scriptCheck === "ok" ? "Script OK" : scriptCheck === "wrong_version" ? "Script Outdated" : scriptCheck === "error" ? "Script Error" : "Verify Script"}
              </span>
            </Button>

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
        {error === "SCRIPT_OUTDATED" && (
          <div className="rounded-xl bg-amber-900/30 border border-amber-700/50 px-5 py-4 text-sm text-amber-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Apps Script needs to be updated — follow these steps to fix:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-amber-100/80 text-xs leading-relaxed pl-1">
              <li>Open your Google Sheet → <strong>Extensions → Apps Script</strong></li>
              <li>Select all existing code and <strong>replace it</strong> with the contents of <code className="bg-amber-900/40 px-1 rounded">google-apps-script/Code.gs</code> from this project</li>
              <li>In the script, set <code className="bg-amber-900/40 px-1 rounded">ADMIN_PASSWORD = "Adilhusain@9967"</code></li>
              <li>Click <strong>Save</strong> (floppy disk icon)</li>
              <li>Click <strong>Deploy → Manage Deployments → Edit (pencil)</strong></li>
              <li>Change Version to <strong>"New version"</strong> → click <strong>Deploy</strong></li>
              <li>Copy the new Web App URL → update <code className="bg-amber-900/40 px-1 rounded">VITE_APPS_SCRIPT_URL</code> if it changed</li>
              <li>Refresh this page and click <strong>Refresh</strong></li>
            </ol>
            <button onClick={loadLeads} className="mt-1 inline-flex items-center gap-1.5 text-xs bg-amber-700/50 hover:bg-amber-700/80 text-amber-100 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="h-3 w-3" /> Retry now
            </button>
          </div>
        )}
        {error === "UNAUTHORIZED" && (
          <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-5 py-4 text-sm text-red-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Password mismatch — Admin password in Apps Script doesn't match
            </div>
            <p className="text-xs text-red-200/70">In your Google Apps Script, set <code className="bg-red-900/40 px-1 rounded">ADMIN_PASSWORD = "Adilhusain@9967"</code>, save, then deploy a new version.</p>
            <button onClick={loadLeads} className="inline-flex items-center gap-1.5 text-xs bg-red-800/50 hover:bg-red-800/80 text-red-100 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}
        {error === "NETWORK_ERROR" && (
          <div className="flex items-start gap-3 rounded-xl bg-red-900/30 border border-red-800/50 px-5 py-4 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Network error</strong> — Could not reach the Apps Script endpoint. Check your internet connection and try again.
              <button onClick={loadLeads} className="ml-3 inline-flex items-center gap-1 text-xs underline hover:no-underline">
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </div>
          </div>
        )}
        {error && error !== "SCRIPT_OUTDATED" && error !== "UNAUTHORIZED" && error !== "NETWORK_ERROR" && (
          <div className="flex items-start gap-3 rounded-xl bg-red-900/30 border border-red-800/50 px-5 py-4 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div><strong>Could not load leads:</strong> {error}</div>
          </div>
        )}

        {/* ── Script health banner (shown after Verify Script is clicked) ── */}
        {scriptCheck === "ok" && (
          <div className="flex items-center gap-3 rounded-xl bg-green-900/30 border border-green-700/50 px-5 py-3 text-sm text-green-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
            <span><strong>Apps Script v3/v4 is live and correct.</strong> Lead submissions will save to the Google Sheet. Admin reads will work.</span>
          </div>
        )}
        {scriptCheck === "wrong_version" && (
          <div className="rounded-xl bg-amber-900/30 border border-amber-700/50 px-5 py-4 text-sm text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Script version is <code className="bg-amber-900/50 px-1 rounded">{scriptDetail}</code> — needs to be v3 or v4 (deploy latest Code.gs)
            </div>
            <p className="text-xs text-amber-100/75">Paste the new <code className="bg-amber-900/40 px-1 rounded">Code.gs</code>, save, then Deploy → Manage Deployments → Edit → New version → Deploy.</p>
            <button onClick={handleVerifyScript} className="inline-flex items-center gap-1.5 text-xs bg-amber-700/50 hover:bg-amber-700/80 text-amber-100 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="h-3 w-3" /> Re-check
            </button>
          </div>
        )}
        {scriptCheck === "error" && (
          <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-5 py-3 text-sm text-red-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Script health check failed
            </div>
            <p className="text-xs text-red-200/70">{scriptDetail}</p>
            <button onClick={handleVerifyScript} className="inline-flex items-center gap-1.5 text-xs bg-red-800/50 hover:bg-red-800/80 text-red-100 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
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
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3 hidden md:table-cell">Capital</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Demat</TableHead>
                    <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Experience</TableHead>
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
