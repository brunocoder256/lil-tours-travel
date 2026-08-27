"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SERVICES = [
  { value: "tourism", label: "Tourism" },
  { value: "work_abroad", label: "Work Abroad" },
  { value: "visa", label: "Visa" },
  { value: "passport", label: "Passport" },
  { value: "air_ticket", label: "Air Ticket" },
  { value: "hotel", label: "Hotel" },
  { value: "airbnb", label: "Airbnb" },
  { value: "car_hire", label: "Car Hire" },
  { value: "delivery", label: "Delivery" },
  { value: "consultancy", label: "Consultancy" },
];

const SOURCES = [
  { value: "field_marketing", label: "Field Marketing" },
  { value: "office_visit", label: "Office Visit" },
  { value: "referral", label: "Referral" },
  { value: "event", label: "Event" },
  { value: "social_media", label: "Social Media" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

interface Props {
  mode?: "create" | "edit";
  initialData?: {
    id?: string;
    full_name?: string;
    phone?: string;
    email?: string;
    district?: string;
    date_of_birth?: string;
    service_interest?: string;
    source?: string;
    notes?: string;
    next_follow_up_at?: string;
    status?: string;
  };
  staffOptions?: { id: string; full_name: string }[];
}

export default function FieldLeadForm({ mode = "create", initialData, staffOptions }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [district, setDistrict] = useState(initialData?.district || "");
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.date_of_birth || "");
  const [serviceInterest, setServiceInterest] = useState(initialData?.service_interest || "");
  const [source, setSource] = useState(initialData?.source || "field_marketing");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [nextFollowUp, setNextFollowUp] = useState(
    initialData?.next_follow_up_at ? initialData.next_follow_up_at.split("T")[0] : ""
  );
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState(initialData?.status || "new");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicateInfo, setDuplicateInfo] = useState<{ type: string; match: { id: string; full_name: string } } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setDuplicateInfo(null);

    const payload: Record<string, unknown> = {
      fullName,
      phone,
      email: email || undefined,
      district: district || undefined,
      dateOfBirth: dateOfBirth || undefined,
      serviceInterest,
      source,
      notes: notes || undefined,
      nextFollowUp: nextFollowUp || undefined,
      assignedTo: assignedTo || undefined,
    };

    if (mode === "edit") {
      payload.status = status;
    }

    try {
      const url = mode === "edit" && initialData?.id
        ? `/api/registry/field-leads/${initialData.id}`
        : "/api/registry/field-leads";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "duplicate_client" || data.error === "duplicate_lead") {
          setDuplicateInfo({ type: data.error, match: data.match });
          setLoading(false);
          return;
        }
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors([data.error || "Failed to save lead"]);
        }
        setLoading(false);
        return;
      }

      if (mode === "create" && data.lead) {
        router.push(`/registry/field-leads/${data.lead.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setErrors(["Failed to save lead. Please try again."]);
      setLoading(false);
    }
  }

  if (duplicateInfo) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="font-medium text-amber-800">Possible existing match found</h3>
            <p className="text-sm text-amber-700 mt-1">{duplicateInfo.match.full_name}</p>
            <p className="text-xs text-amber-600 mt-1">
              {duplicateInfo.type === "duplicate_client" ? "Existing client" : "Existing active lead"}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  if (duplicateInfo.type === "duplicate_client") {
                    router.push(`/registry/clients/${duplicateInfo.match.id}`);
                  } else {
                    router.push(`/registry/field-leads/${duplicateInfo.match.id}`);
                  }
                }}
                className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
              >
                Open {duplicateInfo.type === "duplicate_client" ? "Client" : "Lead"}
              </button>
              <button
                onClick={() => setDuplicateInfo(null)}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-800 underline"
              >
                Create anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-700">{err}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Phone *</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0772XXXXXX"
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">District</label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="e.g. Gulu, Kampala"
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Service Interest *</label>
          <select
            required
            value={serviceInterest}
            onChange={(e) => setServiceInterest(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">Select service</option>
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Source *</label>
          <select
            required
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="Any notes about this lead..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Next Follow-Up</label>
          <input
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        {mode === "edit" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="follow_up">Follow-Up</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not Interested</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        )}
        {staffOptions && staffOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-800 hover:bg-green-900 disabled:bg-zinc-300 text-white font-medium py-2.5 px-6 rounded-md text-sm transition-colors"
        >
          {loading ? "Saving..." : mode === "edit" ? "Update Lead" : "Save Lead"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-zinc-600 hover:text-zinc-800 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
