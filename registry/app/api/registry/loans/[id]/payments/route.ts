import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "loans.track")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const paymentId = typeof b.paymentId === "string" ? b.paymentId.trim() : "";
  const paidAmount = typeof b.paidAmount === "number" ? b.paidAmount : parseFloat(String(b.paidAmount));
  const notes = typeof b.notes === "string" ? b.notes.trim() : "";

  if (!paymentId) return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
  if (isNaN(paidAmount) || paidAmount < 0) return NextResponse.json({ error: "Invalid paid amount" }, { status: 400 });

  try {
    const supabase = createServerClient();

    // Get the payment record
    const { data: payment } = await supabase
      .from("loan_payments")
      .select("id, loan_id, expected_amount")
      .eq("id", paymentId)
      .eq("loan_id", id)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const status = paidAmount >= payment.expected_amount ? "paid" : paidAmount > 0 ? "partial" : "pending";

    const { data: updated, error } = await supabase
      .from("loan_payments")
      .update({
        paid_amount: paidAmount,
        status,
        paid_at: paidAmount > 0 ? new Date().toISOString() : null,
        notes: notes || null,
      })
      .eq("id", paymentId)
      .select("id, status, paid_amount")
      .single();

    if (error) {
      console.error("[api/registry/loans/:id/payments] Update error:", error);
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
    }

    // Check if all payments are paid
    const { data: allPayments } = await supabase
      .from("loan_payments")
      .select("status")
      .eq("loan_id", id);

    if (allPayments && allPayments.every((p) => p.status === "paid")) {
      await supabase
        .from("loan_requests")
        .update({ status: "paid" })
        .eq("id", id);
    }

    return NextResponse.json({ payment: updated });
  } catch (err) {
    console.error("[api/registry/loans/:id/payments] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
