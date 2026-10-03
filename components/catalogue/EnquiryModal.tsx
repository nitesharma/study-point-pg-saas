"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Send, X } from "lucide-react";
import ModalOverlay from "../ui/ModalOverlay";
import { dbService, PGListing } from "../../lib/db";
import { whatsappLink } from "../../lib/catalogue";

const inputCls =
  "w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

export default function EnquiryModal({ listing, onClose }: { listing: PGListing; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sharing, setSharing] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!name.trim() || digits.length < 10) {
      alert("Please enter your name and a valid 10-digit phone number.");
      return;
    }
    setSubmitting(true);
    try {
      await dbService.addEnquiry({
        id: `enq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        propertyId: listing.propertyId,
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
        preferredSharing: sharing,
        moveInDate,
        status: "new",
        createdAt: new Date().toISOString(),
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Could not send your enquiry. Please call or WhatsApp us instead.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappText = `Hi, I'm ${name || "interested"} and I'd like to enquire about ${listing.title}.${
    sharing ? ` Preferred: ${sharing}.` : ""
  }${moveInDate ? ` Move-in: ${moveInDate}.` : ""}${message ? ` ${message}` : ""}`;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 animate-fade-in">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Enquire about this PG</h3>
            <p className="text-xs text-slate-500 mt-0.5">{listing.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <p className="font-bold text-slate-900">Enquiry sent!</p>
              <p className="text-sm text-slate-500 mt-1">Our team will get in touch with you shortly.</p>
            </div>
            <div className="flex gap-2">
              <a
                href={whatsappLink(listing.whatsapp || listing.phone, whatsappText)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
              >
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </a>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Your Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Phone Number *</label>
              <input
                type="tel"
                className={inputCls}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Sharing</label>
                <select className={inputCls} value={sharing} onChange={(e) => setSharing(e.target.value)}>
                  <option value="">Any</option>
                  {listing.pricing.map((p) => (
                    <option key={p.sharing} value={p.sharing}>
                      {p.sharing}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Move-in Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Message</label>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Any questions about rooms, food, timings…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Enquiry
            </button>
          </form>
        )}
      </div>
    </ModalOverlay>
  );
}
