"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SERVICES = [
  { value: "tourism", label: "Tourism" },
  { value: "work_abroad", label: "Work Abroad" },
  { value: "visa", label: "Visa Assistance" },
  { value: "passport", label: "Passport Assistance" },
  { value: "air_ticket", label: "Air Tickets" },
  { value: "hotel", label: "Hotel Reservations" },
  { value: "airbnb", label: "Airbnb" },
  { value: "car_hire", label: "Car Hire" },
  { value: "delivery", label: "Delivery" },
  { value: "consultancy", label: "Consultancy" },
];

const SOURCES = [
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "social_media", label: "Social Media" },
  { value: "field_marketing", label: "Field Marketing" },
  { value: "other", label: "Other" },
];

interface ClientOption {
  id: string;
  full_name: string;
  phone: string;
}

export default function EnquiryForm() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [service, setService] = useState("");
  const [destination, setDestination] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("walk_in");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  // Search clients
  useEffect(() => {
    if (clientSearch.length < 2) {
      setClients([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/registry/clients?search=${encodeURIComponent(clientSearch)}&limit=10`)
        .then((res) => res.json())
        .then((data) => setClients(data.clients || []))
        .catch(() => setClients([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  async function handleCreateClient() {
    if (!newClientName.trim() || !newClientPhone.trim()) return;
    setCreatingClient(true);
    try {
      const res = await fetch("/api/registry/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: newClientName, phone: newClientPhone }),
      });
      const data = await res.json();
      if (res.ok && data.client) {
        setSelectedClientId(data.client.id);
        setClientSearch(data.client.full_name);
        setShowCreateClient(false);
        setNewClientName("");
        setNewClientPhone("");
      } else {
        setError(data.error || "Failed to create client");
      }
    } catch {
      setError("Failed to create client");
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/registry/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClientId,
          service,
          destination,
          preferred_date: preferredDate,
          notes,
          source,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create enquiry");
        setLoading(false);
        return;
      }

      router.push(`/registry/enquiries/${data.enquiry.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200" role="alert">
          {error}
        </div>
      )}

      {/* Client selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Client <span className="text-red-500">*</span>
        </label>
        {!showCreateClient ? (
          <div className="space-y-2">
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setSelectedClientId("");
              }}
              placeholder="Search by name or phone..."
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
            {clients.length > 0 && !selectedClientId && (
              <div className="border border-zinc-200 rounded-md max-h-48 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setClientSearch(c.full_name);
                      setClients([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 text-sm border-b border-zinc-100 last:border-0"
                  >
                    <span className="font-medium">{c.full_name}</span>
                    <span className="text-zinc-500 ml-2">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowCreateClient(true)}
              className="text-sm text-green-700 hover:text-green-800 font-medium"
            >
              + Create new client
            </button>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-md p-3 space-y-2">
            <input
              type="text"
              placeholder="Client name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={creatingClient}
                className="bg-green-800 text-white text-sm px-3 py-1.5 rounded-md disabled:bg-green-600"
              >
                {creatingClient ? "Creating..." : "Create & Select"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateClient(false)}
                className="text-sm text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium text-zinc-700 mb-1">
          Service <span className="text-red-500">*</span>
        </label>
        <select
          id="service"
          required
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          <option value="">Select service...</option>
          {SERVICES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-zinc-700 mb-1">
          Destination
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="preferred_date" className="block text-sm font-medium text-zinc-700 mb-1">
          Preferred Date
        </label>
        <input
          id="preferred_date"
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-zinc-700 mb-1">
          Source
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !selectedClientId || !service}
          className="bg-green-800 hover:bg-green-900 disabled:bg-green-600 text-white font-medium py-2 px-5 rounded-md text-sm transition-colors"
        >
          {loading ? "Creating..." : "Create Enquiry"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium py-2 px-5 rounded-md text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
