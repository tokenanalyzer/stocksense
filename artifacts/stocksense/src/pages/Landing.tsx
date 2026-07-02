import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  CheckCircle2, BookOpen, ShieldCheck, Target, AlertTriangle,
  ArrowRight, UserCheck, LayoutList, TrendingUp, Star,
  ChevronRight, Lightbulb, Users, Clock, Loader2, AlertCircle, X, Menu
} from "lucide-react";
import stockSenseLogo from "@assets/file_000000001d8871fa822307813ae000a5_1780324458986.png";
import imgMentorship from "@assets/1780465735125_1782966224243.png";
import imgEduFirst from "@assets/1780464227209_1782966224414.png";
import imgCurriculum from "@assets/1780464294990_1782966224389.png";
import imgMentorLaptop from "@assets/1780464911662_1782966224341.png";

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

/* ─── Google Apps Script endpoint ─────────────────────────────────────────── */
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

async function submitLead(values: Record<string, unknown>): Promise<void> {
  if (!APPS_SCRIPT_URL) {
    // Dev fallback: log and treat as success so the gate still unlocks during testing
    console.warn("VITE_APPS_SCRIPT_URL not set — skipping network call.");
    console.log("Lead payload:", values);
    return;
  }
  // Google Apps Script Web Apps redirect POST requests internally, which causes the
  // browser to turn the POST into a GET (RFC 7231 §6.4.3) and the response body
  // becomes HTML — not JSON — so attempting res.json() throws and shows an error.
  //
  // Fix: submit with mode:"no-cors". The full POST body still reaches doPost() on
  // the Apps Script side (lead saved, email sent). The response is opaque so we
  // cannot read it, but any completed fetch means the request got through.
  // A genuine network failure (no internet, wrong URL) will still throw and surface
  // the error message to the user.
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(values),
    mode: "no-cors",
  });
}

/* ─── Form schema (shared by popup + inline form) ─────────────────────────── */
const formSchema = z.object({
  fullName:    z.string().min(2, "Full name must be at least 2 characters."),
  mobile:      z.string().min(10, "Enter a valid mobile number."),
  city:        z.string().min(2, "City is required."),
  experience:  z.string().min(1, "Please select your experience level."),
  intent:      z.string().min(10, "Please briefly describe what you want to learn."),
  contactTime: z.string().min(1, "Please select the best time to contact you."),
  consent: z.boolean().refine(v => v === true, "You must agree to be contacted.")
});
type FormValues = z.infer<typeof formSchema>;

/* ─── Animation presets ────────────────────────────────────────────────────── */
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }
};
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

/* ─── Shared lead form fields ──────────────────────────────────────────────── */
function LeadFormFields({ form, onSubmit, submitLabel = "Request My Free Session", isSubmitting = false, submitError }: {
  form: ReturnType<typeof useForm<FormValues>>;
  onSubmit: (v: FormValues) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  submitError?: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium text-sm">Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Rahul Sharma" className="h-11 bg-white border-slate-200 focus:border-green-400" data-testid="input-fullname" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="mobile" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium text-sm">Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="+91 98765 43210" className="h-11 bg-white border-slate-200 focus:border-green-400" data-testid="input-mobile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="city" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-medium text-sm">City</FormLabel>
            <FormControl>
              <Input placeholder="Mumbai, Pune, Delhi…" className="h-11 bg-white border-slate-200 focus:border-green-400" data-testid="input-city" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="experience" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium text-sm">Experience Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-white border-slate-200" data-testid="select-experience">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="beginner">Complete Beginner</SelectItem>
                  <SelectItem value="demat">Have a Demat Account</SelectItem>
                  <SelectItem value="tried">Tried Trading</SelectItem>
                  <SelectItem value="learning">Learning Actively</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="contactTime" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium text-sm">Best Time to Contact</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-white border-slate-200" data-testid="select-contact-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="morning">Morning (10AM – 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (1PM – 4PM)</SelectItem>
                  <SelectItem value="evening">Evening (5PM – 7PM)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="intent" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-medium text-sm">What do you want to understand?</FormLabel>
            <FormControl>
              <Textarea
                placeholder="I want to learn about long-term investing, how to read charts, avoid beginner traps…"
                className="resize-none bg-white border-slate-200 focus:border-green-400 min-h-[80px]"
                data-testid="textarea-intent"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="consent" render={({ field }) => (
          <FormItem className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                data-testid="checkbox-consent"
              />
            </FormControl>
            <div className="leading-tight">
              <FormLabel className="text-sm font-normal text-slate-600 cursor-pointer">
                I agree to be contacted by call, SMS, or WhatsApp regarding my enquiry.
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )} />

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200 transition-all disabled:opacity-70"
          data-testid="button-submit-form"
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            <>{submitLabel} <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
        <p className="text-xs text-center text-slate-400">
          Your information is private and will never be shared with third parties.
        </p>
      </form>
    </Form>
  );
}

/* ─── Success state ────────────────────────────────────────────────────────── */
function SuccessState({ onReset }: { onReset?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center py-10 px-4"
    >
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
          <Star className="h-3 w-3 text-white fill-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received</h3>
      <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">
        Our team will contact you at your preferred time. You're one step closer to market clarity.
      </p>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset} data-testid="button-submit-another" className="text-slate-600">
          Submit another enquiry
        </Button>
      )}
    </motion.div>
  );
}

/* ─── Lead Gate (mandatory — no close/bypass) ──────────────────────────────── */
const SESSION_KEY = "stocksense_lead_submitted";

function LeadGate({ onUnlock }: { onUnlock: () => void }) {
  const [submitted, setSubmitted]     = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", mobile: "", city: "", experience: "", intent: "", contactTime: "", consent: false }
  });

  /* Lock body scroll while gate is visible */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await submitLead({ ...values, timestamp: new Date().toISOString() });
      sessionStorage.setItem(SESSION_KEY, "1");
      setSubmitted(true);
    } catch (err) {
      setSubmitError("Something went wrong. Please try again or refresh the page.");
      console.error("Lead submission error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Overlay — pointer-events blocked so user can't interact with page behind */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        backgroundColor: "rgba(10,15,30,0.72)"
      }}
      /* eat all clicks on the backdrop so nothing passes through */
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Request an intro session"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 28 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden flex flex-col my-auto"
        style={{ boxShadow: "0 40px 100px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.06)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-green-400 via-green-600 to-emerald-500 flex-shrink-0" />

        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex-shrink-0 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 mb-4">
            <BookOpen className="h-3 w-3" />
            Free Intro Session — No Obligation
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            Request an Intro Session
          </h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-lg">
            Share a few details and we'll reach out at your preferred time. Takes under a minute — then explore everything on the page.
          </p>
        </div>

        {/* Form body */}
        <div className="px-7 py-6">
          {submitted ? (
            <SuccessState onReset={onUnlock} />
          ) : (
            <LeadFormFields form={form} onSubmit={handleSubmit} submitLabel="Submit & Access the Page" isSubmitting={isSubmitting} submitError={submitError} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Booking Modal (closeable — shown when lead already captured) ─────────── */
function BookingModal({ onClose }: { onClose: () => void }) {
  const [submitted,   setSubmitted]   = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", mobile: "", city: "", experience: "", intent: "", contactTime: "", consent: false }
  });

  /* ESC key closes */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await submitLead({ ...values, timestamp: new Date().toISOString() });
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,30,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 28 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden flex flex-col my-auto"
        style={{ boxShadow: "0 40px 100px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.06)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-green-400 via-green-600 to-emerald-500 flex-shrink-0" />

        {/* ✕ Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex-shrink-0 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 mb-4">
            <BookOpen className="h-3 w-3" />
            Book Another Session — No Obligation
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            Request Another Session
          </h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-lg">
            Want to book for someone else or request a follow-up session? Fill in the details below.
          </p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {submitted ? (
            <SuccessState onReset={onClose} />
          ) : (
            <LeadFormFields
              form={form}
              onSubmit={handleSubmit}
              submitLabel="Submit Request"
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Animated section wrapper ─────────────────────────────────────────────── */
function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Main Landing Page ────────────────────────────────────────────────────── */
export default function Landing() {
  const [showPopup, setShowPopup] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    const alreadySubmitted = sessionStorage.getItem(SESSION_KEY) === "1";
    if (alreadySubmitted) {
      setLeadSubmitted(true);
      return;
    }
    // Small delay so the page has a moment to paint before the modal appears
    const t = setTimeout(() => setShowPopup(true), 500);
    return () => clearTimeout(t);
  }, []);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleGateUnlock() {
    setShowPopup(false);
    setLeadSubmitted(true);
  }

  /* Smart book handler: closeable modal if already submitted, mandatory gate if not */
  function handleBookClick() {
    if (leadSubmitted) {
      setShowBookingModal(true);
    } else {
      setShowPopup(true);
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Inline page form state
  const [pageFormSubmitted, setPageFormSubmitted] = useState(false);
  const [pageSubmitting, setPageSubmitting]       = useState(false);
  const [pageSubmitError, setPageSubmitError]     = useState<string | undefined>();
  const pageForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", mobile: "", city: "", experience: "", intent: "", contactTime: "", consent: false }
  });
  async function handlePageSubmit(values: FormValues) {
    setPageSubmitting(true);
    setPageSubmitError(undefined);
    try {
      await submitLead({ ...values, timestamp: new Date().toISOString() });
      sessionStorage.setItem(SESSION_KEY, "1");
      setPageFormSubmitted(true);
      setLeadSubmitted(true);
    } catch (err) {
      setPageSubmitError("Something went wrong. Please try again.");
      console.error("Page form submission error:", err);
    } finally {
      setPageSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Mandatory lead gate — no close, no bypass ── */}
      <AnimatePresence>
        {showPopup && <LeadGate onUnlock={handleGateUnlock} />}
      </AnimatePresence>

      {/* ── Closeable booking modal — shown when lead already captured ── */}
      <AnimatePresence>
        {showBookingModal && <BookingModal onClose={() => setShowBookingModal(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ── Navigation ── */}
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-900 backdrop-blur">
          <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
              <img src={stockSenseLogo} alt="StockSense" className="h-12 w-auto" />
            </button>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
              {[["benefits", "Why Learn First"], ["audience", "Who It's For"], ["how-it-works", "How It Works"], ["faq", "FAQ"]].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors" data-testid={`link-${id}`}>
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBookClick}
                className="hidden md:inline-flex bg-green-600 hover:bg-green-700 text-white h-9 px-5 text-sm font-semibold shadow-none"
                data-testid="button-nav-book"
              >
                Book Free Session
              </Button>
              <button
                className="md:hidden text-slate-300 hover:text-white p-1"
                onClick={() => setMobileMenuOpen(o => !o)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden bg-slate-900 border-t border-white/10"
              >
                <nav className="flex flex-col px-4 py-4 gap-1">
                  {[["benefits", "Why Learn First"], ["audience", "Who It's For"], ["how-it-works", "How It Works"], ["faq", "FAQ"]].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => { scrollTo(id); setMobileMenuOpen(false); }}
                      className="text-left text-slate-300 hover:text-white text-sm font-medium py-3 border-b border-slate-800 last:border-0 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <Button
                    onClick={() => { handleBookClick(); setMobileMenuOpen(false); }}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white w-full font-semibold"
                    data-testid="button-nav-book-mobile"
                  >
                    Book Free Session
                  </Button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main>
          {/* ── 1. Hero ── */}
          <section id="hero" className="relative overflow-hidden bg-white">
            {/* Background geometry */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-green-100/60 to-emerald-50/40" />
              <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-slate-100/80 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 pt-20 pb-28 md:pt-28 md:pb-36">
              <motion.div
                initial="hidden" animate="visible" variants={stagger}
                className="max-w-4xl mx-auto text-center"
              >
                <motion.div variants={fadeUp}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700 mb-8 shadow-sm">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Educational Platform · Not Investment Advice
                  </span>
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.08]">
                  Understand the Market
                  <br />
                  <span className="text-green-600">Before You Act.</span>
                </motion.h1>

                <motion.p variants={fadeUp} className="text-xl md:text-2xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                  Structured market education for curious beginners — build clarity, discipline, and confidence before risking your capital.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleBookClick}
                    className="w-full sm:w-auto h-13 px-9 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 transition-all"
                    data-testid="button-hero-book"
                  >
                    Book a Free Intro Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg" variant="ghost"
                    onClick={() => scrollTo("benefits")}
                    className="w-full sm:w-auto h-13 px-9 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    data-testid="button-hero-learn"
                  >
                    Explore the Curriculum
                  </Button>
                </motion.div>

                {/* Social proof strip */}
                <motion.div variants={fadeUp} className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
                  {[
                    { icon: <Users className="h-4 w-4 text-green-600" />, text: "2,000+ curious learners" },
                    { icon: <ShieldCheck className="h-4 w-4 text-green-600" />, text: "No tips. No advice. Just clarity." },
                    { icon: <Clock className="h-4 w-4 text-green-600" />, text: "Free 30-min intro session" },
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 font-medium">{item.icon} {item.text}</span>
                  ))}
                </motion.div>

                {/* Hero featured image */}
                <motion.div variants={fadeUp} className="mt-14 relative rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-2xl">
                  <img
                    src={imgMentorship}
                    alt="One-on-one stock market mentorship session at StockSense"
                    className="w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur text-slate-900 rounded-full px-4 py-2 text-sm font-semibold shadow">
                      <BookOpen className="h-3.5 w-3.5 text-green-600" />
                      Personal mentorship · Education only · Not investment advice
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ── 2. Benefits ── */}
          <section id="benefits" className="py-28 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6">
              <FadeSection className="text-center max-w-2xl mx-auto mb-16">
                <motion.p variants={fadeUp} className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">Why Education First</motion.p>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  A strong foundation is the best decision you can make.
                </motion.h2>
                <motion.p variants={fadeUp} className="text-slate-500 text-lg leading-relaxed">
                  Before you risk capital, build the mental framework that separates disciplined investors from reactive gamblers.
                </motion.p>
              </FadeSection>

              <FadeSection className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: <LayoutList className="h-5 w-5 text-green-600" />,
                    title: "Market Basics",
                    desc: "Understand how markets actually work — indices, sectors, instruments — stripped of hype.",
                    color: "bg-green-50"
                  },
                  {
                    icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
                    title: "Risk Awareness",
                    desc: "Learn to identify and manage risk before it manages you. The most valuable skill.",
                    color: "bg-emerald-50"
                  },
                  {
                    icon: <Target className="h-5 w-5 text-green-600" />,
                    title: "Decision Discipline",
                    desc: "Develop frameworks for calm, rational decisions that aren't driven by fear or FOMO.",
                    color: "bg-teal-50"
                  },
                  {
                    icon: <AlertTriangle className="h-5 w-5 text-green-600" />,
                    title: "Avoid Traps",
                    desc: "Sidestep the expensive emotional traps that catch most beginner investors off-guard.",
                    color: "bg-green-50"
                  }
                ].map((item, i) => (
                  <motion.div
                    key={i} variants={fadeUp}
                    className="group relative bg-white rounded-2xl border border-slate-100 p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className={`h-11 w-11 rounded-xl ${item.color} flex items-center justify-center mb-5`}>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </FadeSection>

              {/* Benefits visual showcase */}
              <FadeSection className="mt-14 grid md:grid-cols-2 gap-6">
                <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
                  <img
                    src={imgEduFirst}
                    alt="Education before investment — StockSense classroom session"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5">
                    <span className="text-white font-bold text-lg leading-tight block">Education First.</span>
                    <span className="text-green-300 text-sm">Learn before you act.</span>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
                  <img
                    src={imgCurriculum}
                    alt="Understanding how markets work — StockSense structured curriculum"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5">
                    <span className="text-white font-bold text-lg leading-tight block">Structured Curriculum.</span>
                    <span className="text-green-300 text-sm">Markets explained clearly.</span>
                  </div>
                </motion.div>
              </FadeSection>
            </div>
          </section>

          {/* ── 3. Who It's For ── */}
          <section id="audience" className="py-28 bg-white">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <FadeSection>
                  <motion.p variants={fadeUp} className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">Who This Is For</motion.p>
                  <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                    Built for the curious. <br />Not the reckless.
                  </motion.h2>
                  <motion.p variants={fadeUp} className="text-lg text-slate-500 mb-10 leading-relaxed">
                    We don't promise overnight wealth. We deliver something rarer: genuine understanding. If you want hot tips, we're not for you. If you want clarity, you've found the right place.
                  </motion.p>
                  <motion.div variants={stagger} className="space-y-5">
                    {[
                      {
                        icon: <Lightbulb className="h-5 w-5 text-green-600" />,
                        title: "Complete Beginners",
                        desc: "Starting from zero and want a structured, jargon-free path."
                      },
                      {
                        icon: <UserCheck className="h-5 w-5 text-green-600" />,
                        title: "Working Professionals",
                        desc: "Have capital but lack the time to filter market noise intelligently."
                      },
                      {
                        icon: <TrendingUp className="h-5 w-5 text-green-600" />,
                        title: "Demat Account Holders",
                        desc: "Opened an account but unsure what to do with it safely and wisely."
                      },
                      {
                        icon: <BookOpen className="h-5 w-5 text-green-600" />,
                        title: "Curious Investors",
                        desc: "Interested in markets but want to learn properly before participating."
                      }
                    ].map((item, i) => (
                      <motion.div key={i} variants={fadeUp} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <p className="text-slate-500 text-sm mt-0.5">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </FadeSection>

                {/* Pull-quote card */}
                <motion.div
                  initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl aspect-[4/5] flex flex-col justify-between p-10">
                    <img src={imgMentorLaptop} alt="StockSense mentor guiding a student through market education" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-slate-900/40" />
                    <div className="relative z-10">
                      <img src={stockSenseLogo} alt="StockSense" className="h-10 w-auto mb-8 opacity-90" />
                    </div>
                    <div className="relative z-10">
                      <div className="w-8 h-0.5 bg-green-500 mb-6" />
                      <blockquote className="text-3xl font-light text-white leading-snug italic mb-6">
                        "An investment in knowledge pays the best interest."
                      </blockquote>
                      <p className="text-slate-400 text-sm">— Benjamin Franklin</p>
                    </div>
                    <div className="relative z-10 flex gap-3 mt-6">
                      <Button
                        onClick={handleBookClick}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-5 h-10"
                        data-testid="button-quote-cta"
                      >
                        Start Learning <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── 4. How It Works ── */}
          <section id="how-it-works" className="py-28 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6">
              <FadeSection className="text-center max-w-2xl mx-auto mb-16">
                <motion.p variants={fadeUp} className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">The Process</motion.p>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Your path to clarity</motion.h2>
                <motion.p variants={fadeUp} className="text-slate-500 text-lg">Three simple steps to begin your educational journey.</motion.p>
              </FadeSection>

              <FadeSection className="grid md:grid-cols-3 gap-8 relative">
                {/* connector line */}
                <div className="hidden md:block absolute top-14 left-[22%] right-[22%] h-px bg-gradient-to-r from-green-200 via-green-300 to-green-200" />
                {[
                  {
                    step: "01",
                    title: "Share Your Interest",
                    desc: "Fill out the brief form to tell us where you currently stand and what you want to understand.",
                    cta: true
                  },
                  {
                    step: "02",
                    title: "We Reach Out",
                    desc: "Our team contacts you at your preferred time for a relaxed, no-pressure conversation.",
                    cta: false
                  },
                  {
                    step: "03",
                    title: "Begin Your Journey",
                    desc: "Start structured learning sessions tailored to your current knowledge level and goals.",
                    cta: false
                  }
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="relative z-10 flex flex-col items-center text-center">
                    <div className="h-28 w-28 rounded-full bg-white border-2 border-green-100 shadow-md flex flex-col items-center justify-center mb-7 transition-shadow hover:shadow-lg">
                      <span className="text-3xl font-extrabold text-green-600 leading-none">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{item.desc}</p>
                    {item.cta && (
                      <Button
                        size="sm"
                        onClick={handleBookClick}
                        className="mt-5 bg-green-600 hover:bg-green-700 text-white"
                        data-testid="button-step-book"
                      >
                        Get Started
                      </Button>
                    )}
                  </motion.div>
                ))}
              </FadeSection>

              {/* How It Works visual */}
              <motion.div
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-14 relative rounded-2xl overflow-hidden shadow-xl"
              >
                <img
                  src={imgCurriculum}
                  alt="StockSense structured curriculum — understanding how markets really work"
                  className="w-full object-cover max-h-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center px-10">
                  <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-2">Educational Platform · Not Investment Advice</p>
                  <h3 className="text-white text-2xl md:text-3xl font-bold max-w-sm leading-snug">Understand how markets really work.</h3>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ── 5. Inline Lead Form (backup / reinforcement) ── */}
          <section id="contact" className="py-28 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(74,222,128,0.07),transparent_55%)] pointer-events-none" />
            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                {/* Left pitch */}
                <FadeSection>
                  <motion.p variants={fadeUp} className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-4">Ready to Start?</motion.p>
                  <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Build your foundation today.
                  </motion.h2>
                  <motion.p variants={fadeUp} className="text-slate-400 text-lg mb-10 leading-relaxed max-w-sm">
                    Book your free introductory session. No obligation. No sales. Just a focused conversation about your learning goals.
                  </motion.p>
                  <motion.div variants={stagger} className="space-y-5">
                    {[
                      { icon: <UserCheck className="h-5 w-5 text-green-400" />, title: "Personalised Approach", desc: "Tailored to your current knowledge and goals." },
                      { icon: <ShieldCheck className="h-5 w-5 text-green-400" />, title: "No Pressure. No Sales Pitch.", desc: "An educational discovery call — not a pitch for trading tools." },
                      { icon: <Clock className="h-5 w-5 text-green-400" />, title: "Your Time, Your Schedule", desc: "Choose the slot that works best for you." }
                    ].map((item, i) => (
                      <motion.div key={i} variants={fadeUp} className="flex gap-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                          <p className="text-slate-400 text-sm">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </FadeSection>

                {/* Right form card */}
                <motion.div
                  initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-2xl p-7 md:p-10 shadow-2xl"
                >
                  {pageFormSubmitted ? (
                    <SuccessState />
                  ) : leadSubmitted ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center py-12 gap-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">You're already on the list</h3>
                      <p className="text-slate-500 text-sm max-w-xs">Your request has been received. We'll be in touch soon.</p>
                    </motion.div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-slate-900 mb-1">Request an Intro Session</h3>
                      <p className="text-slate-500 text-sm mb-6">Fill in your details below — takes less than a minute.</p>
                      <LeadFormFields form={pageForm} onSubmit={handlePageSubmit} submitLabel="Request My Session" isSubmitting={pageSubmitting} submitError={pageSubmitError} />
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── 6. FAQ ── */}
          <section id="faq" className="py-28 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
              <FadeSection className="text-center mb-16">
                <motion.p variants={fadeUp} className="text-green-600 text-sm font-semibold uppercase tracking-widest mb-3">Common Questions</motion.p>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Frequently Asked</motion.h2>
                <motion.p variants={fadeUp} className="text-slate-500 text-lg">Everything you need to know before getting started.</motion.p>
              </FadeSection>

              <FadeSection>
                <motion.div variants={fadeUp}>
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {[
                      {
                        q: "Is this for complete beginners?",
                        a: "Absolutely. StockSense is built specifically for people starting from zero. We strip away the jargon and build your confidence step-by-step with practical, grounded learning."
                      },
                      {
                        q: "Do I need a demat account to join?",
                        a: "No. We actually recommend understanding the basics before opening one. If you already have a demat account but lack clarity on what to do with it, we're the right place to start."
                      },
                      {
                        q: "Is this educational or investment advisory?",
                        a: "StockSense is strictly an educational platform. We provide market awareness and learning resources. We do not provide stock tips, investment advice, or buy/sell recommendations of any kind."
                      },
                      {
                        q: "How will I be contacted?",
                        a: "Once you submit your request, our team will reach out via phone call or WhatsApp during your preferred time slot to discuss your learning goals and background."
                      },
                      {
                        q: "What happens after I submit the form?",
                        a: "You'll have a brief, no-pressure discovery call with a member of our team. We'll understand your current knowledge level and suggest a learning path that fits your pace and goals."
                      },
                      {
                        q: "Is there any fee for the intro session?",
                        a: "The introductory session is completely free. It's a no-obligation conversation to help us understand your goals and for you to understand what StockSense offers."
                      }
                    ].map((item, i) => (
                      <AccordionItem
                        key={i} value={`item-${i}`}
                        className="bg-slate-50 px-6 rounded-xl border border-slate-100 hover:border-green-100 hover:bg-green-50/30 transition-colors"
                        data-testid={`faq-item-${i}`}
                      >
                        <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline py-5 gap-4">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-5">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              </FadeSection>

              <FadeSection className="mt-12 text-center">
                <motion.div variants={fadeUp} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-10 text-white">
                  <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
                  <p className="text-green-100 mb-6 text-sm">Book your free intro session and get all your questions answered personally.</p>
                  <Button
                    onClick={handleBookClick}
                    className="bg-white text-green-700 hover:bg-green-50 font-semibold h-11 px-8"
                    data-testid="button-faq-cta"
                  >
                    Book a Free Session <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </FadeSection>
            </div>
          </section>
        </main>

        {/* ── Footer & Disclaimer ── */}
        <footer className="bg-slate-900 pt-16 pb-8 border-t border-slate-800">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-3 gap-12 mb-14">
              <div className="md:col-span-1">
                <img src={stockSenseLogo} alt="StockSense" className="h-12 w-auto mb-5" />
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                  Clarity Before Capital. Structured market education for curious, serious beginners.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Navigate</h4>
                <ul className="space-y-3 text-slate-400 text-sm">
                  {[["hero", "Home"], ["benefits", "Why Education"], ["audience", "Who It's For"], ["how-it-works", "How It Works"], ["faq", "FAQ"]].map(([id, label]) => (
                    <li key={id}>
                      <button onClick={() => scrollTo(id)} className="hover:text-white transition-colors">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Contact</h4>
                <ul className="space-y-3 text-slate-400 text-sm">
                  {/* Replace placeholders below with real contact details */}
                  <li>
                    <a href="mailto:stocksense00@gmail.com" className="hover:text-green-400 transition-colors">
                      stocksense00@gmail.com
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/919167514859"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chat on WhatsApp"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      <svg viewBox="0 0 32 32" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.47.644 4.888 1.87 7.01L2 30l7.188-1.884A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm0 25.538a11.49 11.49 0 01-5.86-1.6l-.42-.25-4.268 1.12 1.14-4.16-.274-.43a11.538 11.538 0 1110.682 5.32zm6.32-8.63c-.347-.174-2.054-1.014-2.374-1.13-.32-.115-.553-.173-.786.174-.233.347-.9 1.13-1.103 1.363-.202.232-.405.26-.752.086-.347-.174-1.464-.54-2.788-1.72-1.03-.918-1.725-2.05-1.928-2.397-.202-.347-.022-.534.152-.707.157-.155.347-.405.52-.607.174-.202.232-.347.347-.578.116-.232.058-.435-.029-.608-.087-.174-.786-1.893-1.077-2.594-.283-.682-.572-.59-.786-.6l-.67-.012c-.232 0-.608.087-.926.434-.318.347-1.216 1.188-1.216 2.897s1.245 3.36 1.418 3.593c.174.232 2.45 3.74 5.937 5.244.83.358 1.478.572 1.983.733.833.265 1.59.228 2.189.138.668-.1 2.054-.84 2.345-1.652.29-.812.29-1.508.203-1.653-.087-.144-.32-.23-.666-.405z"/>
                      </svg>
                    </a>
                  </li>
                </ul>
                <Button
                  size="sm"
                  onClick={handleBookClick}
                  className="mt-6 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-footer-book"
                >
                  Book a Session
                </Button>
              </div>
            </div>

            <Separator className="bg-slate-800 mb-8" />

            <div className="bg-slate-800/50 rounded-xl p-6 mb-8 text-xs text-slate-400 leading-relaxed border border-slate-800">
              <strong className="text-slate-300 block mb-2">Disclaimer</strong>
              StockSense is strictly an educational institute providing stock market training and classes. We do not provide financial advice, stock tips, or portfolio management services. We are not SEBI registered. All content and sessions are strictly for educational and learning purposes only. Users are entirely responsible for their own financial decisions. Please consult a SEBI-registered financial advisor before making any financial decisions.
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 gap-4">
              <p>© {new Date().getFullYear()} StockSense Education. All rights reserved.</p>
              <div className="flex gap-5">
                <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ── WhatsApp Floating Button ── */}
      <a
        href="https://wa.me/919167514859"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform"
        style={{ backgroundColor: "#25D366" }}
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.47.644 4.888 1.87 7.01L2 30l7.188-1.884A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm0 25.538a11.49 11.49 0 01-5.86-1.6l-.42-.25-4.268 1.12 1.14-4.16-.274-.43a11.538 11.538 0 1110.682 5.32zm6.32-8.63c-.347-.174-2.054-1.014-2.374-1.13-.32-.115-.553-.173-.786.174-.233.347-.9 1.13-1.103 1.363-.202.232-.405.26-.752.086-.347-.174-1.464-.54-2.788-1.72-1.03-.918-1.725-2.05-1.928-2.397-.202-.347-.022-.534.152-.707.157-.155.347-.405.52-.607.174-.202.232-.347.347-.578.116-.232.058-.435-.029-.608-.087-.174-.786-1.893-1.077-2.594-.283-.682-.572-.59-.786-.6l-.67-.012c-.232 0-.608.087-.926.434-.318.347-1.216 1.188-1.216 2.897s1.245 3.36 1.418 3.593c.174.232 2.45 3.74 5.937 5.244.83.358 1.478.572 1.983.733.833.265 1.59.228 2.189.138.668-.1 2.054-.84 2.345-1.652.29-.812.29-1.508.203-1.653-.087-.144-.32-.23-.666-.405z"/>
        </svg>
      </a>
    </>
  );
}
