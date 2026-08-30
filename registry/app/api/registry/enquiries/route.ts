import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";

const VALID_SERVICES = ["tourism","work_abroad","visa","passport","air_ticket","hotel","airbnb","car_hire","delivery","consultancy"];
const VALID_STATUSES = ["new","contacted","in_progress","completed","cancelled"];
const VALID_SOURCES = ["website","whatsapp","field_marketing","referral","social_media","walk_in","other"];

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "enquiries.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const service = searchParams.get("service")?.trim() || "";
    const source = searchParams.get("source")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom")?.trim() || "";
    const dateTo = searchParams.get("dateTo")?.trim() || "";

    let query = supabase
      .from("enquiries")
      .select("id, client_id, service, destination, status, source, preferred_date, notes, created_at, clients(full_name, phone)", { count: "exact" });

    if (search) {
      // Search through client name/phone via join
      query = query.or(`destination.ilike.%${search}%,notes.ilike.%${search}%,clients.full_name.ilike.%${search}%,clients.phone.ilike.%${search}%`);
    }
    if (status && VALID_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }
    if (service && VALID_SERVICES.includes(service)) {
      query = query.eq("service", service);
    }
    if (source && VALID_SOURCES.includes(source)) {
      query = query.eq("source", source);
    }
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo + "T23:59:59");
    }

    const { data: enquiries, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const formatted = (enquiries || []).map((eq: Record<string, unknown>) => {
      const client = eq.clients as { full_name: string; phone: string } | null;
      return {
        id: eq.id,
        client_id: eq.client_id,
        client_name: client?.full_name || "Unknown",
        client_phone: client?.phone || "",
        service: eq.service,
        destination: eq.destination,
        status: eq.status,
        source: eq.source,
        preferred_date: eq.preferred_date,
        notes: eq.notes,
        created_at: eq.created_at,
      };
    });

    return NextResponse.json({
      enquiries: formatted,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error("[api/registry/enquiries] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "enquiries.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 20000) return NextResponse.json({ error: "Payload too large" }, { status: 400 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const clientId = typeof b.client_id === "string" ? b.client_id.trim() : "";
  const service = typeof b.service === "string" ? b.service.trim().toLowerCase().replace(/\s+/g, "_") : "";
  const destination = typeof b.destination === "string" ? b.destination.trim() : "";
  const preferredDate = typeof b.preferred_date === "string" ? b.preferred_date.trim() : "";
  const notes = typeof b.notes === "string" ? b.notes.trim() : "";
  const source = typeof b.source === "string" ? b.source.trim().toLowerCase().replace(/\s+/g, "_") : "walk_in";

  if (!clientId) return NextResponse.json({ error: "Client is required" }, { status: 400 });
  if (!service || !VALID_SERVICES.includes(service)) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }
  if (source && !VALID_SOURCES.includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // Verify client exists
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data: enquiry, error } = await supabase
      .from("enquiries")
      .insert({
        client_id: clientId,
        service,
        destination: destination || null,
        preferred_date: preferredDate || null,
        notes: notes || null,
        source,
        status: "new",
      })
      .select("id, client_id, service, destination, status, source, created_at")
      .single();

    if (error) {
      console.error("[api/registry/enquiries] Create error:", error);
      return NextResponse.json({ error: "Failed to create enquiry" }, { status: 500 });
    }

    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (err) {
    console.error("[api/registry/enquiries] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
