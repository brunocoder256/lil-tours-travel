import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "loans.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const supabase = createServerClient();

    const { data: loan, error } = await supabase
      .from("loan_requests")
      .select("*, clients(full_name, phone, email, district)")
      .eq("id", id)
      .single();

    if (error || !loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Fetch payment records
    const { data: payments } = await supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", id)
      .order("period_label", { ascending: true });

    return NextResponse.json({ loan, payments: payments || [] });
  } catch (err) {
    console.error("[api/registry/loans/:id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 20000) return NextResponse.json({ error: "Payload too large" }, { status: 400 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updateFields: { status?: string; notes?: string | null; cancel_reason?: string | null; approved_by?: string; approved_at?: string } = {};

  if (typeof b.status === "string") {
    const s = b.status.trim().toLowerCase();
    if (!["pending", "approved", "cancelled", "paid"].includes(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateFields.status = s;
  }

  if (typeof b.notes === "string") {
    updateFields.notes = b.notes.trim() || null;
  }

  if (typeof b.cancelReason === "string") {
    updateFields.cancel_reason = b.cancelReason.trim() || null;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // If approving, set approved_by and approved_at, and create payment schedule
    if (updateFields.status === "approved") {
      updateFields.approved_by = userId;
      updateFields.approved_at = new Date().toISOString();

      // Get loan details for payment schedule
      const { data: loan } = await supabase
        .from("loan_requests")
        .select("loan_amount, repayment_period, monthly_payment")
        .eq("id", id)
        .single();

      if (loan) {
        const now = new Date();
        const payments = [];
        for (let i = 0; i < loan.repayment_period; i++) {
          const periodDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
          const periodLabel = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, "0")}`;
          payments.push({
            loan_id: id,
            period_label: periodLabel,
            period_type: "monthly",
            expected_amount: loan.monthly_payment,
            paid_amount: 0,
            status: "pending",
          });
        }

        if (payments.length > 0) {
          await supabase.from("loan_payments").insert(payments);
        }
      }
    }

    const { data: loan, error } = await supabase
      .from("loan_requests")
      .update(updateFields)
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      console.error("[api/registry/loans/:id] Update error:", error);
      return NextResponse.json({ error: "Failed to update loan" }, { status: 500 });
    }

    return NextResponse.json({ loan });
  } catch (err) {
    console.error("[api/registry/loans/:id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
