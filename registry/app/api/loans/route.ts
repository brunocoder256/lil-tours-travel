import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateLoan, normalizePhone } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Json } from "@/lib/types/database";

const ALLOWED_ORIGINS = [
  "https://lil-tours-travel-2u84.vercel.app",
  "https://liltoursandtravel.com",
  "https://www.liltoursandtravel.com",
  "http://localhost:3000",
  "http://localhost:8080",
];

function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);

  if (!rate.allowed) {
    console.warn(`[loans] Rate limited: ${ip}`);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { ...corsHeaders, "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) } }
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 50000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 400, headers: corsHeaders });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }

  const result = validateLoan(body);
  if (!result.ok) {
    console.warn(`[loans] Validation failed:`, result.errors);
    return NextResponse.json({ error: "Validation failed", details: result.errors }, { status: 400, headers: corsHeaders });
  }

  const data = result.data!;

  try {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhone(data.phone);

    // Find or create client
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", normalizedPhone)
      .single();

    let clientId: string;

    if (existingClient) {
      clientId = existingClient.id;
      const updateFields: { full_name?: string; email?: string; district?: string } = {};
      if (data.fullName) updateFields.full_name = data.fullName;
      if (data.email) updateFields.email = data.email;
      if (data.district) updateFields.district = data.district;
      if (Object.keys(updateFields).length > 0) {
        await supabase.from("clients").update(updateFields).eq("id", clientId);
      }
    } else {
      const { data: newClient, error: createError } = await supabase
        .from("clients")
        .insert({
          full_name: data.fullName,
          phone: normalizedPhone,
          email: data.email,
          district: data.district,
        })
        .select("id")
        .single();

      if (createError || !newClient) {
        console.error(`[loans] Client creation failed:`, createError);
        return NextResponse.json(
          { error: "Failed to process loan request. Please try again." },
          { status: 500, headers: corsHeaders }
        );
      }
      clientId = newClient.id;
    }

    // Create loan request
    const { data: loan, error: loanError } = await supabase
      .from("loan_requests")
      .insert({
        client_id: clientId,
        full_name: data.fullName,
        phone: normalizedPhone,
        email: data.email,
        national_id: data.nationalId,
        district: data.district,
        loan_amount: data.loanAmount,
        loan_purpose: data.loanPurpose,
        repayment_period: data.repaymentPeriod,
        monthly_payment: data.monthlyPayment,
        employment_status: data.employmentStatus,
        monthly_income: data.monthlyIncome,
        income_source: data.incomeSource,
        collateral_description: data.collateralDescription,
        guarantor_name: data.guarantorName,
        guarantor_phone: data.guarantorPhone,
        source: "website",
        status: "pending",
      })
      .select("id")
      .single();

    if (loanError || !loan) {
      console.error(`[loans] Loan creation failed:`, loanError);
      return NextResponse.json(
        { error: "Failed to save loan request. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`[loans] Created: ${loan.id} for client ${clientId} (amount: ${data.loanAmount})`);

    return NextResponse.json(
      { success: true, loanId: loan.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error(`[loans] Unexpected error:`, err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}
