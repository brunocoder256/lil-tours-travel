"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConnection } from "@/components/ConnectionProvider";
import {
  saveOfflineLead,
  addToSyncQueue,
  getAllOfflineLeads,
  type OfflineLead,
} from "@/lib/offline/db";

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

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

// Draft storage key
const DRAFT_KEY = "lil-tours-lead-draft";

export default function FieldLeadForm({ mode = "create", initialData, staffOptions }: Props) {
  const router = useRouter();
  const { isOnline, triggerSync } = useConnection();
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
  const [offlineLeads, setOfflineLeads] = useState<OfflineLead[]>([]);
  const [saveResult, setSaveResult] = useState<{ type: "online" | "offline"; leadId?: string } | null>(null);

  // Load offline leads for display
  const loadOfflineLeads = useCallback(async () => {
    try {
      const leads = await getAllOfflineLeads();
      setOfflineLeads(leads.filter((l) => l.sync_status !== "synced"));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { loadOfflineLeads(); }, [loadOfflineLeads]);

  // Draft protection
  useEffect(() => {
    if (mode !== "create") return;
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const d = JSON.parse(draft) as { fullName?: string; phone?: string; serviceInterest?: string };
        if (d.fullName) setFullName(d.fullName);
        if (d.phone) setPhone(d.phone);
        if (d.serviceInterest) setServiceInterest(d.serviceInterest);
      } catch {
        // ignore
      }
    }
  }, [mode]);

  // Auto-save draft
  useEffect(() => {
    if (mode !== "create") return;
    if (fullName || phone) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ fullName, phone, email, district, serviceInterest, source, notes }));
    }
  }, [fullName, phone, email, district, serviceInterest, source, notes, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setDuplicateInfo(null);
    setSaveResult(null);

    // Validate locally
    if (!fullName.trim()) { setErrors(["Full name is required"]); setLoading(false); return; }
    if (!phone.trim()) { setErrors(["Phone number is required"]); setLoading(false); return; }
    if (!serviceInterest) { setErrors(["Service interest is required"]); setLoading(false); return; }

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      district: district.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      serviceInterest,
      source,
      notes: notes.trim() || undefined,
      nextFollowUp: nextFollowUp || undefined,
      assignedTo: assignedTo || undefined,
      status: mode === "edit" ? status : undefined,
    };

    // Offline path
    if (!isOnline || mode === "create") {
      const leadId = generateUUID();
      const now = new Date().toISOString();

      const offlineLead: OfflineLead = {
        id: leadId,
        server_id: initialData?.id || null,
        full_name: payload.fullName,
        phone: payload.phone,
        email: payload.email || null,
        district: payload.district || null,
        date_of_birth: payload.dateOfBirth || null,
        service_interest: payload.serviceInterest,
        source: payload.source,
        notes: payload.notes || null,
        status: "new",
        created_by: "local",
        created_at: now,
        updated_at: now,
        sync_status: "pending",
      };

      try {
        await saveOfflineLead(offlineLead);
        await addToSyncQueue({
          id: generateUUID(),
          operation: mode === "edit" ? "update" : "create",
          entity: "field_lead",
          entity_id: leadId,
          payload: { ...payload, version: 1 },
          created_at: now,
          attempts: 0,
          last_attempt_at: null,
          status: "pending",
          error: null,
        });

        localStorage.removeItem(DRAFT_KEY);
        setSaveResult({ type: "offline", leadId });

        // Auto-sync if online
        if (isOnline) {
          setTimeout(triggerSync, 500);
        }

        await loadOfflineLeads();
        setLoading(false);
        return;
      } catch {
        setErrors(["Unable to save offline data on this device. Please reconnect and try again."]);
        setLoading(false);
        return;
      }
    }

    // Online path (for edit mode when online)
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

      localStorage.removeItem(DRAFT_KEY);
      if (data.lead) {
        router.push(`/registry/field-leads/${data.lead.id}`);
      } else {
        setSaveResult({ type: "online" });
        router.refresh();
      }
    } catch {
      setErrors(["Failed to save lead. Please try again."]);
      setLoading(false);
    }
  }

  // Save result display
  if (saveResult) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <svg className="w-10 h-10 text-green-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-semibold text-green-800 text-lg">
          {saveResult.type === "offline" ? "Lead saved on this device" : "Lead saved successfully"}
        </h3>
        {saveResult.type === "offline" && (
          <p className="text-sm text-green-700 mt-2">
            It will sync automatically when internet connection returns.
          </p>
        )}
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={() => {
              setSaveResult(null);
              setFullName("");
              setPhone("");
              setEmail("");
              setDistrict("");
              setDateOfBirth("");
              setServiceInterest("");
              setSource("field_marketing");
              setNotes("");
              setNextFollowUp("");
            }}
            className="text-sm font-medium text-green-800 hover:text-green-900 underline"
          >
            Add Another Lead
          </button>
          {saveResult.leadId && (
            <button
              onClick={() => router.push(`/registry/field-leads/${saveResult.leadId}`)}
              className="text-sm font-medium text-green-800 hover:text-green-900 underline"
            >
              View Lead
            </button>
          )}
        </div>
      </div>
    );
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-700">{err}</p>
            ))}
          </div>
        )}

        {!isOnline && mode === "create" && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2 text-sm text-amber-800">
            <span className="flex-shrink-0" aria-hidden="true">⚡</span>
            <span>You&apos;re offline. This lead will be saved locally and synced later.</span>
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

      {/* Pending offline leads */}
      {offlineLeads.length > 0 && (
        <div className="border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-medium text-zinc-700 mb-3">
            Pending Offline Leads ({offlineLeads.length})
          </h3>
          <div className="space-y-2">
            {offlineLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between bg-white border border-zinc-100 rounded-md px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-zinc-900">{lead.full_name}</span>
                  <span className="text-zinc-500 ml-2 capitalize">{lead.service_interest.replace(/_/g, " ")}</span>
                </div>
                <span className={`text-xs ${lead.sync_status === "synced" ? "text-green-600" : lead.sync_status === "failed" ? "text-red-600" : "text-amber-600"}`}>
                  {lead.sync_status === "synced" ? "✓ Synced" : lead.sync_status === "failed" ? "⚠ Failed" : "⏳ Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
