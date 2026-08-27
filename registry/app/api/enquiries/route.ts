import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateEnquiry, normalizePhone } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Json } from "@/lib/types/database";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);

  if (!rate.allowed) {
    console.warn(`[enquiries] Rate limited: ${ip}`);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) } }
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 50000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 400 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateEnquiry(body);
  if (!result.ok) {
    console.warn(`[enquiries] Validation failed:`, result.errors);
    return NextResponse.json({ error: "Validation failed", details: result.errors }, { status: 400 });
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

      // Update client info if new data provided
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
        console.error(`[enquiries] Client creation failed:`, createError);
        return NextResponse.json(
          { error: "Failed to process enquiry. Please try WhatsApp." },
          { status: 500 }
        );
      }
      clientId = newClient.id;
    }

    // Create enquiry
    const { data: enquiry, error: enquiryError } = await supabase
      .from("enquiries")
      .insert({
        client_id: clientId,
        service: data.service,
        destination: data.destination,
        preferred_date: data.preferredDate,
        notes: data.notes,
        details: data.details as Json,
        source: "website",
        status: "new",
      })
      .select("id")
      .single();

    if (enquiryError || !enquiry) {
      console.error(`[enquiries] Enquiry creation failed:`, enquiryError);
      return NextResponse.json(
        { error: "Failed to save enquiry. Please try WhatsApp." },
        { status: 500 }
      );
    }

    console.log(`[enquiries] Created: ${enquiry.id} for client ${clientId} (${data.service})`);

    return NextResponse.json(
      { success: true, enquiryId: enquiry.id },
      { status: 201 }
    );
  } catch (err) {
    console.error(`[enquiries] Unexpected error:`, err);
    return NextResponse.json(
      { error: "Something went wrong. Please try WhatsApp." },
      { status: 500 }
    );
  }
}
