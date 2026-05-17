import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, XCircle, User, Phone, Mail, MapPin, Wrench, Star,
    Loader2, RefreshCw, LogIn, LogOut, ShieldCheck, AlertTriangle,
    BadgeCheck, Trash2, ToggleLeft, ToggleRight, ClipboardList, Settings,
    ShieldX, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/* ──────────────────────────────────────────────────────────────
   Config — never shown in UI
────────────────────────────────────────────────────────────── */
const ADMIN_EMAIL = "helproadbuddy@gmail.com";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;
const LOCKOUT_KEY = "rb_lockout";
const ATTEMPTS_KEY = "rb_attempts";

/* ──────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────── */
interface Application {
    id: string; name: string; phone_number: string; email: string;
    garage_name: string; services: string; address: string;
    latitude: number | null; longitude: number | null;
    experience_years: number; status: "pending" | "approved" | "rejected";
    admin_note: string | null; created_at: string;
}
interface VerifiedMechanic {
    id: string; application_id: string | null; name: string;
    phone_number: string; email: string; garage_name: string;
    services: string; address: string; latitude: number; longitude: number;
    experience_years: number; verified: boolean; created_at: string;
}
type Tab = "applications" | "mechanics";

/* ──────────────────────────────────────────────────────────────
   Rate-limit helpers
────────────────────────────────────────────────────────────── */
function getAttempts(): number { return parseInt(localStorage.getItem(ATTEMPTS_KEY) || "0", 10); }
function setAttempts(n: number) { localStorage.setItem(ATTEMPTS_KEY, String(n)); }
function lockoutUntil(): Date | null {
    const ts = localStorage.getItem(LOCKOUT_KEY);
    return ts ? new Date(ts) : null;
}
function setLockout() {
    const until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    localStorage.setItem(LOCKOUT_KEY, until.toISOString());
}
function clearRateLimit() {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
}
function isLockedOut(): boolean {
    const until = lockoutUntil();
    if (!until) return false;
    if (new Date() > until) { clearRateLimit(); return false; }
    return true;
}
function lockoutSecondsLeft(): number {
    const until = lockoutUntil();
    if (!until) return 0;
    return Math.max(0, Math.ceil((until.getTime() - Date.now()) / 1000));
}

/* ──────────────────────────────────────────────────────────────
   Email helper
────────────────────────────────────────────────────────────── */
async function sendEmail(to: string, subject: string, body: Record<string, string>) {
    try {
        await fetch(`https://formsubmit.co/ajax/${to}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ _subject: subject, _template: "table", _captcha: "false", ...body }),
        });
    } catch (e) { console.warn("[Email] failed:", e); }
}

/* ──────────────────────────────────────────────────────────────
   Status badge
────────────────────────────────────────────────────────────── */
const statusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-green-100 text-green-700 border border-green-300 flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Verified</Badge>;
    if (s === "rejected") return <Badge className="bg-red-100 text-red-700 border border-red-300">❌ Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">⏳ Pending</Badge>;
};
const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/* ══════════════════════════════════════════════════════════════
   Admin Panel Component
══════════════════════════════════════════════════════════════ */
const AdminPanel = () => {
    const navigate = useNavigate();

    /* ── Auth ── */
    const [authLoading, setAuthLoading] = useState(true);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [lockedOut, setLockedOut] = useState(isLockedOut());
    const [lockSecsLeft, setLockSecsLeft] = useState(lockoutSecondsLeft());

    /* ── Panel ── */
    const [tab, setTab] = useState<Tab>("applications");
    const [applications, setApplications] = useState<Application[]>([]);
    const [appLoading, setAppLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
    const [acting, setActing] = useState<Record<string, boolean>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [mechanics, setMechanics] = useState<VerifiedMechanic[]>([]);
    const [mechLoading, setMechLoading] = useState(false);
    const [mechActing, setMechActing] = useState<Record<string, boolean>>({});
    const [mechSearch, setMechSearch] = useState("");

    /* ── Lockout countdown ── */
    useEffect(() => {
        if (!lockedOut) return;
        const t = setInterval(() => {
            if (!isLockedOut()) { setLockedOut(false); setLockSecsLeft(0); clearInterval(t); }
            else setLockSecsLeft(lockoutSecondsLeft());
        }, 1000);
        return () => clearInterval(t);
    }, [lockedOut]);

    /* ── Auth subscription ── */
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            setIsAdmin(u?.email === ADMIN_EMAIL);
            setAuthLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            const u = session?.user ?? null;
            setUser(u);
            setIsAdmin(u?.email === ADMIN_EMAIL);
            setAuthLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    /* ── Sign in with rate limiting ── */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLockedOut()) { setLockedOut(true); return; }

        setLoginLoading(true);
        setLoginError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail.trim().toLowerCase(),
                password: loginPassword,
            });

            if (error || data.user?.email !== ADMIN_EMAIL) {
                // Wrong creds or wrong account — increment attempt counter
                if (data.user) await supabase.auth.signOut();   // boot non-admin who authenticated
                const attempts = getAttempts() + 1;
                setAttempts(attempts);
                if (attempts >= MAX_ATTEMPTS) {
                    setLockout();
                    setLockedOut(true);
                    setLockSecsLeft(lockoutSecondsLeft());
                    setLoginError(`Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`);
                } else {
                    const remaining = MAX_ATTEMPTS - attempts;
                    setLoginError(`Unauthorized access.${remaining <= 2 ? ` ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.` : ""}`);
                }
                return;
            }

            // Success — clear any rate-limit state
            clearRateLimit();
            toast.success("Welcome, Admin! 👋");
        } catch {
            setLoginError("Unauthorized access.");
        } finally {
            setLoginLoading(false);
        }
    };

    /* ── Sign out ── */
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setLoginEmail("");
        setLoginPassword("");
        toast.info("Signed out.");
    };

    /* ── Data fetchers ── */
    const fetchApps = useCallback(async () => {
        setAppLoading(true);
        try {
            let q = (supabase as any).from("mechanic_applications").select("*").order("created_at", { ascending: false });
            if (statusFilter !== "all") q = q.eq("status", statusFilter);
            const { data, error } = await q;
            if (error) throw error;
            setApplications(data || []);
        } catch (e: any) { toast.error("Failed to load applications: " + e.message); }
        finally { setAppLoading(false); }
    }, [statusFilter]);

    const fetchMechanics = useCallback(async () => {
        setMechLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from("verified_mechanics").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            setMechanics(data || []);
        } catch (e: any) { toast.error("Failed to load mechanics: " + e.message); }
        finally { setMechLoading(false); }
    }, []);

    useEffect(() => { if (isAdmin) { fetchApps(); fetchMechanics(); } }, [isAdmin, fetchApps, fetchMechanics]);

    /* ── Approve ── */
    const approve = async (app: Application) => {
        if (!app.latitude || !app.longitude) { toast.error("Cannot approve: coordinates missing."); return; }
        setActing((a) => ({ ...a, [app.id]: true }));
        try {
            const { error: ie } = await (supabase as any).from("verified_mechanics").insert({
                application_id: app.id, name: app.name, phone_number: app.phone_number,
                email: app.email, garage_name: app.garage_name, services: app.services,
                address: app.address, latitude: app.latitude, longitude: app.longitude,
                experience_years: app.experience_years, verified: true,
            });
            if (ie) throw ie;
            const { error: ue } = await (supabase as any)
                .from("mechanic_applications").update({ status: "approved" }).eq("id", app.id);
            if (ue) throw ue;
            await sendEmail(app.email, "✅ RoadBuddy Mechanic Application Approved", {
                "": `Hello ${app.name},`,
                "Message": "Your application has been approved. You are now a Verified Mechanic on RoadBuddy!",
                "Workshop": app.garage_name, "Status": "✔ Verified Mechanic",
            });
            await sendEmail(ADMIN_EMAIL, "Mechanic Approved – RoadBuddy", {
                "Name": app.name, "Garage": app.garage_name, "Status": "Approved ✔",
            });
            toast.success(`✅ ${app.garage_name} is now Verified!`);
            fetchApps(); fetchMechanics();
        } catch (e: any) { toast.error("Approve failed: " + e.message); }
        finally { setActing((a) => ({ ...a, [app.id]: false })); }
    };

    /* ── Reject ── */
    const reject = async (app: Application) => {
        setActing((a) => ({ ...a, [app.id]: true }));
        try {
            const { error } = await (supabase as any)
                .from("mechanic_applications").update({ status: "rejected", admin_note: rejectNote[app.id] || null }).eq("id", app.id);
            if (error) throw error;
            await sendEmail(app.email, "RoadBuddy Partner Application – Update", {
                "Message": `Hi ${app.name}, your application for ${app.garage_name} was not approved.`,
                ...(rejectNote[app.id] ? { "Reason": rejectNote[app.id] } : {}),
            });
            toast.success("Application rejected.");
            fetchApps();
        } catch (e: any) { toast.error("Reject failed: " + e.message); }
        finally { setActing((a) => ({ ...a, [app.id]: false })); }
    };

    /* ── Toggle verified ── */
    const toggleVerified = async (m: VerifiedMechanic) => {
        setMechActing((a) => ({ ...a, [m.id]: true }));
        try {
            const { error } = await (supabase as any)
                .from("verified_mechanics").update({ verified: !m.verified }).eq("id", m.id);
            if (error) throw error;
            toast.success(!m.verified ? `✅ ${m.garage_name} is now Verified.` : `⚠️ ${m.garage_name} verification removed.`);
            fetchMechanics();
        } catch (e: any) { toast.error("Update failed: " + e.message); }
        finally { setMechActing((a) => ({ ...a, [m.id]: false })); }
    };

    /* ── Delete mechanic ── */
    const deleteMechanic = async (m: VerifiedMechanic) => {
        if (!confirm(`Permanently delete "${m.garage_name}"? This cannot be undone.`)) return;
        setMechActing((a) => ({ ...a, [m.id]: true }));
        try {
            const { error } = await (supabase as any).from("verified_mechanics").delete().eq("id", m.id);
            if (error) throw error;
            toast.success(`"${m.garage_name}" removed.`);
            fetchMechanics();
        } catch (e: any) { toast.error("Delete failed: " + e.message); }
        finally { setMechActing((a) => ({ ...a, [m.id]: false })); }
    };

    const counts = {
        all: applications.length,
        pending: applications.filter((a) => a.status === "pending").length,
        approved: applications.filter((a) => a.status === "approved").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
    };
    const filteredMechanics = mechanics.filter((m) =>
        !mechSearch ||
        m.garage_name.toLowerCase().includes(mechSearch.toLowerCase()) ||
        m.name.toLowerCase().includes(mechSearch.toLowerCase()) ||
        m.address.toLowerCase().includes(mechSearch.toLowerCase())
    );

    /* ════════════ RENDER — Loading ════════════ */
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    /* ════════════ RENDER — Not logged in ════════════ */
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">

                    {/* Header — no email hints */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Admin Login</h1>
                            <p className="text-xs text-slate-500">Restricted portal — authorised users only</p>
                        </div>
                    </div>

                    {/* Lockout banner */}
                    {lockedOut && (
                        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <div>
                                <strong>Too many failed attempts.</strong>
                                <br />Try again in <strong>{Math.ceil(lockSecsLeft / 60)}:{String(lockSecsLeft % 60).padStart(2, "0")}</strong> minutes.
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm text-slate-700">Email</Label>
                            <Input id="email" type="email" value={loginEmail} autoComplete="username"
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="Enter your email"
                                disabled={lockedOut}
                                className="border-slate-300 focus:border-blue-500" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="pwd" className="text-sm text-slate-700">Password</Label>
                            <Input id="pwd" type="password" value={loginPassword} autoComplete="current-password"
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={lockedOut}
                                className="border-slate-300 focus:border-blue-500" required />
                        </div>

                        {loginError && !lockedOut && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                {loginError}
                            </div>
                        )}

                        <Button type="submit" disabled={loginLoading || lockedOut}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                            {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                            Sign In
                        </Button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-4">
                        <button onClick={() => navigate("/")} className="hover:text-blue-600 underline transition-colors">
                            ← Back to homepage
                        </button>
                    </p>
                </motion.div>
            </div>
        );
    }

    /* ════════════ RENDER — Non-admin email ════════════ */
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldX className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Unauthorised Access</h1>
                    <p className="text-sm text-slate-500 mb-6">You do not have permission to access this portal.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>Go to Homepage</Button>
                        <Button onClick={handleLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                            <LogOut className="w-4 h-4 mr-1" /> Sign Out
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ════════════ RENDER — Admin Dashboard ════════════ */
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="pt-20 pb-16">
                <div className="container mx-auto px-4 max-w-5xl">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-blue-600" /> RoadBuddy Admin
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                Signed in as <strong>{user.email}</strong>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => tab === "applications" ? fetchApps() : fetchMechanics()} disabled={appLoading || mechLoading}>
                                <RefreshCw className={`w-4 h-4 mr-1.5 ${(appLoading || mechLoading) ? "animate-spin" : ""}`} /> Refresh
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50">
                                <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white mb-6 w-fit shadow-sm">
                        {([
                            { key: "applications", label: "Applications", icon: ClipboardList, count: counts.pending },
                            { key: "mechanics", label: "Manage Mechanics", icon: Settings, count: mechanics.length },
                        ] as const).map(({ key, label, icon: Icon, count }) => (
                            <button key={key} onClick={() => setTab(key)}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all ${tab === key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                                <Icon className="w-4 h-4" />
                                {label}
                                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${tab === key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                            </button>
                        ))}
                    </div>

                    {/* ──── APPLICATIONS TAB ──── */}
                    {tab === "applications" && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                                    <button key={s} onClick={() => setStatusFilter(s)}
                                        className={`p-4 rounded-xl border text-left transition-all ${statusFilter === s ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                                        <div className={`text-2xl font-bold ${s === "approved" ? "text-green-600" : s === "pending" ? "text-yellow-600" : s === "rejected" ? "text-red-500" : "text-slate-900"}`}>{counts[s]}</div>
                                        <div className="text-xs text-slate-500 capitalize mt-0.5">{s}</div>
                                    </button>
                                ))}
                            </div>

                            {appLoading ? (
                                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" /><span className="text-slate-500">Loading…</span></div>
                            ) : applications.length === 0 ? (
                                <div className="text-center py-20 text-slate-400"><AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No applications found.</p></div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {applications.map((app) => (
                                            <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                <Card className={`bg-white shadow-sm border ${app.status === "approved" ? "border-green-200" : app.status === "rejected" ? "border-red-100" : "border-slate-200"}`}>
                                                    <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                                            <div>
                                                                <CardTitle className="text-base text-slate-900 flex items-center gap-2 flex-wrap">
                                                                    <Wrench className="w-4 h-4 text-blue-600 shrink-0" />{app.garage_name}
                                                                    {app.status === "approved" && <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-semibold"><BadgeCheck className="w-3 h-3" />Verified</span>}
                                                                </CardTitle>
                                                                <p className="text-sm text-slate-500 mt-0.5">{app.name} · {fmt(app.created_at)}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">{statusBadge(app.status)}<span className="text-xs text-slate-400">{expandedId === app.id ? "▲" : "▼"}</span></div>
                                                        </div>
                                                    </CardHeader>
                                                    <AnimatePresence>
                                                        {expandedId === app.id && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                                                                <CardContent className="pt-0 space-y-4">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-slate-50 rounded-lg p-4">
                                                                        <div className="flex items-center gap-2 text-slate-600"><User className="w-3.5 h-3.5 shrink-0 text-slate-400" />{app.name}</div>
                                                                        <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />{app.phone_number}</div>
                                                                        <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />{app.email}</div>
                                                                        <div className="flex items-center gap-2 text-slate-600"><Star className="w-3.5 h-3.5 shrink-0 text-slate-400" />{app.experience_years} yrs experience</div>
                                                                        <div className="flex items-start gap-2 text-slate-600 sm:col-span-2"><MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />{app.address}</div>
                                                                        {app.latitude && app.longitude && (
                                                                            <div className="flex items-center gap-2 text-xs text-slate-500 sm:col-span-2">
                                                                                <MapPin className="w-3 h-3 text-blue-400" />{app.latitude.toFixed(5)}, {app.longitude.toFixed(5)}
                                                                                <a href={`https://www.google.com/maps?q=${app.latitude},${app.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">View on Maps</a>
                                                                            </div>
                                                                        )}
                                                                        {!app.latitude && <div className="text-xs text-amber-600 sm:col-span-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />No coordinates — cannot approve without location</div>}
                                                                        <div className="flex items-start gap-2 text-slate-600 sm:col-span-2"><Wrench className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />{app.services}</div>
                                                                    </div>
                                                                    {app.status === "pending" && (
                                                                        <div className="pt-2 border-t border-slate-100 space-y-3">
                                                                            <Textarea placeholder="Optional rejection reason (emailed to mechanic if rejected)" value={rejectNote[app.id] || ""} onChange={(e) => setRejectNote((r) => ({ ...r, [app.id]: e.target.value }))} className="text-sm min-h-[60px]" />
                                                                            <div className="flex gap-3">
                                                                                <Button size="sm" disabled={acting[app.id] || !app.latitude} onClick={() => approve(app)} className="bg-green-600 hover:bg-green-700 text-white flex-1 gap-1.5">
                                                                                    {acting[app.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}Approve & Verify
                                                                                </Button>
                                                                                <Button size="sm" variant="outline" disabled={acting[app.id]} onClick={() => reject(app)} className="border-red-300 text-red-600 hover:bg-red-50 flex-1 gap-1.5">
                                                                                    {acting[app.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}Reject
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {app.status === "approved" && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"><CheckCircle className="w-4 h-4 shrink-0" />This mechanic is <strong>Verified</strong> and visible in the nearby list.</div>}
                                                                    {app.status !== "pending" && app.admin_note && <div className="text-xs text-slate-500 border-t border-slate-100 pt-2"><strong>Admin note:</strong> {app.admin_note}</div>}
                                                                </CardContent>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </>
                    )}

                    {/* ──── MANAGE MECHANICS TAB ──── */}
                    {tab === "mechanics" && (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                                    <div className="text-2xl font-bold text-green-600">{mechanics.filter(m => m.verified).length}</div>
                                    <div className="text-xs text-green-700 mt-0.5 flex items-center gap-1"><BadgeCheck className="w-3 h-3" />Verified (visible in search)</div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                    <div className="text-2xl font-bold text-slate-500">{mechanics.filter(m => !m.verified).length}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Unverified (hidden from search)</div>
                                </div>
                            </div>
                            <div className="mb-4"><Input placeholder="Search by name, garage or location…" value={mechSearch} onChange={(e) => setMechSearch(e.target.value)} className="bg-white border-slate-200" /></div>
                            {mechLoading ? (
                                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" /><span className="text-slate-500">Loading…</span></div>
                            ) : filteredMechanics.length === 0 ? (
                                <div className="text-center py-20 text-slate-400"><Settings className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No mechanics found. Approve applications to add mechanics here.</p></div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {filteredMechanics.map((m) => (
                                            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                <Card className={`bg-white shadow-sm border transition-all ${m.verified ? "border-green-200 bg-green-50/20" : "border-slate-200"}`}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                    <h3 className="font-semibold text-slate-900 text-sm">{m.garage_name}</h3>
                                                                    {m.verified
                                                                        ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 border border-green-300 rounded-full px-2 py-0.5"><BadgeCheck className="w-3 h-3" />Verified Mechanic</span>
                                                                        : <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">Not Verified</span>}
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                                                                    <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" />{m.name}</div>
                                                                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{m.phone_number}</div>
                                                                    <div className="flex items-center gap-1.5 sm:col-span-2"><MapPin className="w-3 h-3 text-slate-400 shrink-0" />{m.address}</div>
                                                                    <div className="flex items-start gap-1.5 sm:col-span-2"><Wrench className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />{m.services}</div>
                                                                    <div className="flex items-center gap-1.5"><Star className="w-3 h-3 text-slate-400" />{m.experience_years} yrs experience</div>
                                                                    <button onClick={() => window.open(`https://www.google.com/maps?q=${m.latitude},${m.longitude}`, "_blank")} className="flex items-center gap-1.5 text-blue-600 hover:underline text-xs"><MapPin className="w-3 h-3" />View on Maps</button>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 shrink-0">
                                                                <Button size="sm" disabled={mechActing[m.id]} onClick={() => toggleVerified(m)}
                                                                    className={`text-xs h-8 gap-1.5 min-w-[155px] ${m.verified ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300" : "bg-green-600 hover:bg-green-700 text-white"}`}>
                                                                    {mechActing[m.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : m.verified ? <><ToggleLeft className="w-3.5 h-3.5" />Remove Verification</> : <><ToggleRight className="w-3.5 h-3.5" />Verify Mechanic</>}
                                                                </Button>
                                                                <Button size="sm" variant="outline" disabled={mechActing[m.id]} onClick={() => deleteMechanic(m)} className="text-xs h-8 gap-1.5 border-red-200 text-red-500 hover:bg-red-50 min-w-[155px]">
                                                                    <Trash2 className="w-3.5 h-3.5" />Delete Mechanic
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
