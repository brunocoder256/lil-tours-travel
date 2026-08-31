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

// ============================================
// Field Lead Validation
// ============================================

const VALID_LEAD_STATUSES = [
  "new", "contacted", "interested", "follow_up", "converted", "not_interested", "lost",
] as const;

const VALID_LEAD_SOURCES = [
  "field_marketing", "office_visit", "referral", "event", "social_media", "phone", "whatsapp", "other",
] as const;

export interface FieldLeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  district?: string;
  dateOfBirth?: string;
  serviceInterest: string;
  source?: string;
  notes?: string;
  nextFollowUp?: string;
  assignedTo?: string;
}

export interface FieldLeadValidationResult {
  ok: boolean;
  errors: string[];
  data?: {
    fullName: string;
    phone: string;
    email: string | null;
    district: string | null;
    dateOfBirth: string | null;
    serviceInterest: ValidService;
    source: string;
    notes: string | null;
    nextFollowUp: string | null;
    assignedTo: string | null;
  };
}

export function validateFieldLead(input: unknown): FieldLeadValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid request body"] };
  }

  const body = input as Record<string, unknown>;

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) errors.push("Full name is required");
  else if (fullName.length > MAX_NAME_LENGTH) errors.push(`Full name must be under ${MAX_NAME_LENGTH} characters`);

  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!rawPhone) errors.push("Phone number is required");
  else if (rawPhone.length > MAX_PHONE_LENGTH) errors.push(`Phone must be under ${MAX_PHONE_LENGTH} characters`);

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email && email.length > MAX_EMAIL_LENGTH) errors.push(`Email must be under ${MAX_EMAIL_LENGTH} characters`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");

  const district = typeof body.district === "string" ? body.district.trim() : "";

  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth.trim() : "";
  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) errors.push("Invalid date of birth format (use YYYY-MM-DD)");

  const serviceInterest = typeof body.serviceInterest === "string" ? body.serviceInterest.trim().toLowerCase().replace(/\s+/g, "_") : "";
  if (!serviceInterest) errors.push("Service interest is required");
  else if (!VALID_SERVICES.includes(serviceInterest as ValidService)) errors.push(`Invalid service: ${serviceInterest}`);

  const source = typeof body.source === "string" ? body.source.trim().toLowerCase().replace(/\s+/g, "_") : "field_marketing";
  if (!VALID_LEAD_SOURCES.includes(source as typeof VALID_LEAD_SOURCES[number])) errors.push(`Invalid source: ${source}`);

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes.length > MAX_NOTES_LENGTH) errors.push(`Notes must be under ${MAX_NOTES_LENGTH} characters`);

  const nextFollowUp = typeof body.nextFollowUp === "string" ? body.nextFollowUp.trim() : "";
  if (nextFollowUp && !/^\d{4}-\d{2}-\d{2}$/.test(nextFollowUp)) errors.push("Invalid follow-up date format (use YYYY-MM-DD)");

  const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo.trim() : "";

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    data: {
      fullName,
      phone: rawPhone,
      email: email || null,
      district: district || null,
      dateOfBirth: dateOfBirth || null,
      serviceInterest: serviceInterest as ValidService,
      source,
      notes: notes || null,
      nextFollowUp: nextFollowUp || null,
      assignedTo: assignedTo || null,
    },
  };
}

export function validateFieldLeadUpdate(input: unknown): { ok: boolean; errors: string[]; data?: Record<string, unknown> } {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["Invalid request body"] };

  const body = input as Record<string, unknown>;
  const updateFields: Record<string, unknown> = {};

  if (typeof body.fullName === "string") {
    const name = body.fullName.trim();
    if (!name) errors.push("Full name cannot be empty");
    else if (name.length > MAX_NAME_LENGTH) errors.push(`Full name must be under ${MAX_NAME_LENGTH} characters`);
    else updateFields.full_name = name;
  }
  if (typeof body.phone === "string") {
    updateFields.phone = normalizePhone(body.phone.trim());
  }
  if (typeof body.email === "string") {
    const e = body.email.trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.push("Invalid email format");
    else updateFields.email = e || null;
  }
  if (typeof body.district === "string") updateFields.district = body.district.trim() || null;
  if (typeof body.dateOfBirth === "string") updateFields.date_of_birth = body.dateOfBirth.trim() || null;
  if (typeof body.serviceInterest === "string") {
    const s = body.serviceInterest.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_SERVICES.includes(s as ValidService)) errors.push(`Invalid service: ${s}`);
    else updateFields.service_interest = s;
  }
  if (typeof body.status === "string") {
    const s = body.status.trim();
    if (!VALID_LEAD_STATUSES.includes(s as typeof VALID_LEAD_STATUSES[number])) errors.push(`Invalid status: ${s}`);
    else updateFields.status = s;
  }
  if (typeof body.source === "string") {
    const s = body.source.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_LEAD_SOURCES.includes(s as typeof VALID_LEAD_SOURCES[number])) errors.push(`Invalid source: ${s}`);
    else updateFields.source = s;
  }
  if (typeof body.notes === "string") updateFields.notes = body.notes.trim() || null;
  if (typeof body.assignedTo === "string") updateFields.assigned_to = body.assignedTo.trim() || null;
  if (typeof body.nextFollowUp === "string") updateFields.next_follow_up_at = body.nextFollowUp.trim() || null;
  if (typeof body.lastContactedAt === "string") updateFields.last_contacted_at = body.lastContactedAt.trim() || null;

  if (errors.length > 0) return { ok: false, errors };
  if (Object.keys(updateFields).length === 0) return { ok: false, errors: ["No fields to update"] };

  return { ok: true, errors: [], data: updateFields };
}

export function validateFollowUp(input: unknown): { ok: boolean; errors: string[]; data?: { fieldLeadId: string; dueAt: string; notes: string | null } } {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["Invalid request body"] };

  const body = input as Record<string, unknown>;

  const fieldLeadId = typeof body.fieldLeadId === "string" ? body.fieldLeadId.trim() : "";
  if (!fieldLeadId) errors.push("Field lead is required");

  const dueAt = typeof body.dueAt === "string" ? body.dueAt.trim() : "";
  if (!dueAt) errors.push("Due date is required");

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    data: { fieldLeadId, dueAt, notes: notes || null },
  };
}

// ============================================
// Loan Request Validation
// ============================================

const VALID_EMPLOYMENT_STATUSES = ["employed", "self_employed", "business_owner", "student", "unemployed", "other"] as const;

export interface LoanPayload {
  fullName: string;
  phone: string;
  email?: string;
  nationalId?: string;
  district?: string;
  loanAmount: number;
  loanPurpose: string;
  repaymentPeriod: number;
  employmentStatus: string;
  monthlyIncome?: number;
  incomeSource?: string;
  collateralDescription?: string;
  guarantorName?: string;
  guarantorPhone?: string;
}

export interface LoanValidationResult {
  ok: boolean;
  errors: string[];
  data?: {
    fullName: string;
    phone: string;
    email: string | null;
    nationalId: string | null;
    district: string | null;
    loanAmount: number;
    loanPurpose: string;
    repaymentPeriod: number;
    monthlyPayment: number;
    employmentStatus: string;
    monthlyIncome: number | null;
    incomeSource: string | null;
    collateralDescription: string | null;
    guarantorName: string | null;
    guarantorPhone: string | null;
  };
}

export function validateLoan(input: unknown): LoanValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid request body"] };
  }

  const body = input as Record<string, unknown>;

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) errors.push("Full name is required");
  else if (fullName.length > MAX_NAME_LENGTH) errors.push(`Full name must be under ${MAX_NAME_LENGTH} characters`);

  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!rawPhone) errors.push("Phone number is required");
  else if (rawPhone.length > MAX_PHONE_LENGTH) errors.push(`Phone must be under ${MAX_PHONE_LENGTH} characters`);

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email && email.length > MAX_EMAIL_LENGTH) errors.push(`Email must be under ${MAX_EMAIL_LENGTH} characters`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");

  const nationalId = typeof body.nationalId === "string" ? body.nationalId.trim() : "";
  const district = typeof body.district === "string" ? body.district.trim() : "";

  const loanAmount = typeof body.loanAmount === "number" ? body.loanAmount : parseFloat(String(body.loanAmount));
  if (!loanAmount || loanAmount <= 0) errors.push("Loan amount must be greater than 0");
  else if (loanAmount > 100000000) errors.push("Loan amount is too large");

  const loanPurpose = typeof body.loanPurpose === "string" ? body.loanPurpose.trim() : "";
  if (!loanPurpose) errors.push("Loan purpose is required");
  else if (loanPurpose.length > MAX_NOTES_LENGTH) errors.push(`Loan purpose must be under ${MAX_NOTES_LENGTH} characters`);

  const repaymentPeriod = typeof body.repaymentPeriod === "number" ? body.repaymentPeriod : parseInt(String(body.repaymentPeriod), 10);
  if (!repaymentPeriod || repaymentPeriod < 1) errors.push("Repayment period must be at least 1 month");
  else if (repaymentPeriod > 60) errors.push("Repayment period cannot exceed 60 months");

  const monthlyPayment = loanAmount && repaymentPeriod ? Math.ceil(loanAmount / repaymentPeriod) : 0;

  const employmentStatus = typeof body.employmentStatus === "string" ? body.employmentStatus.trim().toLowerCase().replace(/\s+/g, "_") : "";
  if (!employmentStatus) errors.push("Employment status is required");
  else if (!VALID_EMPLOYMENT_STATUSES.includes(employmentStatus as typeof VALID_EMPLOYMENT_STATUSES[number])) {
    errors.push(`Invalid employment status: ${employmentStatus}`);
  }

  const monthlyIncome = typeof body.monthlyIncome === "number" ? body.monthlyIncome : parseFloat(String(body.monthlyIncome));
  const incomeSource = typeof body.incomeSource === "string" ? body.incomeSource.trim() : "";
  const collateralDescription = typeof body.collateralDescription === "string" ? body.collateralDescription.trim() : "";
  const guarantorName = typeof body.guarantorName === "string" ? body.guarantorName.trim() : "";
  const guarantorPhone = typeof body.guarantorPhone === "string" ? body.guarantorPhone.trim() : "";

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    data: {
      fullName,
      phone: rawPhone,
      email: email || null,
      nationalId: nationalId || null,
      district: district || null,
      loanAmount,
      loanPurpose,
      repaymentPeriod,
      monthlyPayment,
      employmentStatus,
      monthlyIncome: isNaN(monthlyIncome) ? null : monthlyIncome,
      incomeSource: incomeSource || null,
      collateralDescription: collateralDescription || null,
      guarantorName: guarantorName || null,
      guarantorPhone: guarantorPhone || null,
    },
  };
}
