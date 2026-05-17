const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "helproadbuddy@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY"); // optional – graceful fallback

// ── helpers ──────────────────────────────────────────────────────────────────

async function dbQuery(path: string, opts: RequestInit) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...opts,
        headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
            ...(opts.headers ?? {}),
        },
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function sendEmail(to: string, subject: string, html: string) {
    if (!RESEND_API_KEY) {
        console.log(`[Email] RESEND_API_KEY not set – logging email only`);
        console.log(`  TO: ${to}\n  SUBJECT: ${subject}`);
        return;
    }
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: "RoadBuddy <noreply@roadbuddy.in>",
            to,
            subject,
            html,
        }),
    });
    if (!res.ok) {
        const t = await res.text();
        console.warn("[Email] send failed:", t);
    } else {
        console.log("[Email] sent to", to);
    }
}

// ── actions ───────────────────────────────────────────────────────────────────

/** Called right after a mechanic submits the form */
async function handleNewApplication(app: any) {
    const html = `
    <h2 style="color:#1D4ED8">New Mechanic Registration – RoadBuddy</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Name</td><td>${app.name}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Phone</td><td>${app.phone_number}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Email</td><td>${app.email}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Garage</td><td>${app.garage_name}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Address</td><td>${app.address}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Services</td><td>${app.services}</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Experience</td><td>${app.experience_years} years</td></tr>
      <tr><td style="padding:6px 12px;color:#475569;font-weight:600">Coordinates</td>
          <td>${app.latitude ?? "–"}, ${app.longitude ?? "–"}</td></tr>
    </table>
    <br/>
    <p style="color:#64748b;font-size:13px">
      Log in to the <strong>RoadBuddy Admin Panel</strong> at
      <a href="https://roadbuddy.in/admin">roadbuddy.in/admin</a>
      to approve or reject this application.
    </p>`;

    await sendEmail(ADMIN_EMAIL, "🔧 New Mechanic Registration – RoadBuddy", html);
    return { ok: true };
}

/** Admin approves a mechanic application */
async function handleApprove(applicationId: string) {
    // Fetch the application
    const [app] = await dbQuery(
        `mechanic_applications?id=eq.${applicationId}&select=*`,
        { method: "GET" }
    );
    if (!app) throw new Error("Application not found");
    if (!app.latitude || !app.longitude) {
        throw new Error("Cannot approve: latitude/longitude are missing.");
    }

    // Insert into verified_mechanics
    await dbQuery("verified_mechanics", {
        method: "POST",
        body: JSON.stringify({
            application_id: app.id,
            name: app.name,
            phone_number: app.phone_number,
            email: app.email,
            garage_name: app.garage_name,
            services: app.services,
            address: app.address,
            latitude: app.latitude,
            longitude: app.longitude,
            experience_years: app.experience_years,
            verified: true,
        }),
    });

    // Update status  
    await dbQuery(`mechanic_applications?id=eq.${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
    });

    // Email the mechanic
    const html = `
    <h2 style="color:#16a34a">Congratulations! You're now a Verified RoadBuddy Partner 🎉</h2>
    <p>Hi <strong>${app.name}</strong>,</p>
    <p>Your mechanic partner application for <strong>${app.garage_name}</strong> has been
    <strong style="color:#16a34a">approved</strong>.</p>
    <p>You are now listed as a <em>Verified Mechanic</em> on the RoadBuddy platform. Customers
    in your area will be able to find and contact you when they need roadside assistance.</p>
    <p style="color:#475569">Questions? Reply to this email or contact us at ${ADMIN_EMAIL}.</p>
    <br/><p style="color:#94a3b8;font-size:12px">RoadBuddy – 24/7 Roadside Assistance</p>`;

    await sendEmail(app.email, "✅ Your RoadBuddy Application is Approved!", html);
    return { ok: true, message: "Approved and mechanic notified." };
}

/** Admin rejects a mechanic application */
async function handleReject(applicationId: string, note?: string) {
    const [app] = await dbQuery(
        `mechanic_applications?id=eq.${applicationId}&select=*`,
        { method: "GET" }
    );
    if (!app) throw new Error("Application not found");

    await dbQuery(`mechanic_applications?id=eq.${applicationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected", admin_note: note ?? null }),
    });

    const html = `
    <h2 style="color:#dc2626">RoadBuddy Mechanic Application Update</h2>
    <p>Hi <strong>${app.name}</strong>,</p>
    <p>Unfortunately your application for <strong>${app.garage_name}</strong> has not been approved at this time.</p>
    ${note ? `<p><strong>Reason:</strong> ${note}</p>` : ""}
    <p>You are welcome to re-apply after addressing any issues. For questions contact ${ADMIN_EMAIL}.</p>`;

    await sendEmail(app.email, "RoadBuddy Partner Application – Update", html);
    return { ok: true, message: "Rejected and applicant notified." };
}

/** List all applications (admin only) */
async function handleListApplications(status?: string) {
    const filter = status ? `status=eq.${status}&` : "";
    const data = await dbQuery(
        `mechanic_applications?${filter}order=created_at.desc&select=*`,
        { method: "GET" }
    );
    return { applications: data };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    try {
        const body = await req.json();
        const { action, ...payload } = body;

        console.log(`[mechanic-admin] action=${action}`);

        let result: any;
        switch (action) {
            case "new_application":
                result = await handleNewApplication(payload.application);
                break;
            case "approve":
                result = await handleApprove(payload.applicationId);
                break;
            case "reject":
                result = await handleReject(payload.applicationId, payload.note);
                break;
            case "list":
                result = await handleListApplications(payload.status);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...CORS, "Content-Type": "application/json" },
        });
    } catch (e: any) {
        console.error("[mechanic-admin] error:", e);
        return new Response(
            JSON.stringify({ error: e.message ?? "Unknown error" }),
            { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
        );
    }
});
