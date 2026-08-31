import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";

const VALID_LOAN_STATUSES = ["pending", "approved", "cancelled", "paid"];

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "loans.view")) {
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

    let query = supabase
      .from("loan_requests")
      .select("id, client_id, full_name, phone, email, loan_amount, loan_purpose, repayment_period, monthly_payment, employment_status, status, source, created_at, approved_at, cancel_reason", { count: "exact" });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,loan_purpose.ilike.%${search}%`);
    }
    if (status && VALID_LOAN_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    const { data: loans, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      items: loans || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error("[api/registry/loans] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
