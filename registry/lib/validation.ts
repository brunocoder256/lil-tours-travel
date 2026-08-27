const VALID_SERVICES = [
  "tourism", "work_abroad", "visa", "passport", "air_ticket",
  "hotel", "airbnb", "car_hire", "delivery", "consultancy",
] as const;

type ValidService = (typeof VALID_SERVICES)[number];

export interface EnquiryPayload {
  fullName: string;
  phone: string;
  email?: string;
  district?: string;
  service: string;
  destination?: string;
  preferredDate?: string;
  notes?: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  data?: {
    fullName: string;
    phone: string;
    email: string | null;
    district: string | null;
    service: ValidService;
    destination: string | null;
    preferredDate: string | null;
    notes: string | null;
    details: Record<string, unknown>;
  };
}

const MAX_NAME_LENGTH = 200;
const MAX_PHONE_LENGTH = 30;
const MAX_EMAIL_LENGTH = 254;
const MAX_NOTES_LENGTH = 5000;
const MAX_DETAILS_SIZE = 10000;

export function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-\(\)\.]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (p.startsWith("0")) p = "+256" + p;
  if (!p.startsWith("+")) p = "+" + p;
  return p;
}

export function validateEnquiry(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid request body"] };
  }

  const body = input as Record<string, unknown>;

  // fullName
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) {
    errors.push("Full name is required");
  } else if (fullName.length > MAX_NAME_LENGTH) {
    errors.push(`Full name must be under ${MAX_NAME_LENGTH} characters`);
  }

  // phone
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!rawPhone) {
    errors.push("Phone number is required");
  } else if (rawPhone.length > MAX_PHONE_LENGTH) {
    errors.push(`Phone must be under ${MAX_PHONE_LENGTH} characters`);
  }

  // email (optional)
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email && email.length > MAX_EMAIL_LENGTH) {
    errors.push(`Email must be under ${MAX_EMAIL_LENGTH} characters`);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  // district (optional)
  const district = typeof body.district === "string" ? body.district.trim() : "";

  // service
  const service = typeof body.service === "string" ? body.service.trim().toLowerCase().replace(/\s+/g, "_") : "";
  if (!service) {
    errors.push("Service is required");
  } else if (!VALID_SERVICES.includes(service as ValidService)) {
    errors.push(`Invalid service: ${service}`);
  }

  // destination (optional)
  const destination = typeof body.destination === "string" ? body.destination.trim() : "";

  // preferredDate (optional)
  const preferredDate = typeof body.preferredDate === "string" ? body.preferredDate.trim() : "";
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    errors.push("Invalid date format (use YYYY-MM-DD)");
  }

  // notes (optional)
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes.length > MAX_NOTES_LENGTH) {
    errors.push(`Notes must be under ${MAX_NOTES_LENGTH} characters`);
  }

  // details (optional JSON)
  let details: Record<string, unknown> = {};
  if (body.details && typeof body.details === "object" && !Array.isArray(body.details)) {
    const serialized = JSON.stringify(body.details);
    if (serialized.length > MAX_DETAILS_SIZE) {
      errors.push("Details payload is too large");
    } else {
      details = body.details as Record<string, unknown>;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    data: {
      fullName,
      phone: rawPhone,
      email: email || null,
      district: district || null,
      service: service as ValidService,
      destination: destination || null,
      preferredDate: preferredDate || null,
      notes: notes || null,
      details,
    },
  };
}
