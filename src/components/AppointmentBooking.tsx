"use client";

import { useState } from "react";
import { Calendar, Clock, X, Check, MapPin } from "lucide-react";

interface AppointmentBookingProps {
  propertyTitle: string;
  propertyId: number;
  agentName: string;
  agentPhone: string;
}

export default function AppointmentBooking({
  propertyTitle,
  propertyId,
  agentName,
  agentPhone,
}: AppointmentBookingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          ...formData,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setFormData({ date: "", time: "", name: "", email: "", phone: "", message: "" });
        setTimeout(() => {
          setIsOpen(false);
          setStatus("idle");
        }, 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-success text-white text-sm font-semibold rounded-lg hover:bg-success/90 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Book Viewing
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Book a Viewing</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Property Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-5 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{propertyTitle}</p>
                  <p className="text-xs text-gray-500">Agent: {agentName}</p>
                </div>
              </div>

              {status === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Viewing Booked!</h4>
                  <p className="text-sm text-gray-500">
                    Our agent will contact you to confirm.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      Preferred Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData({ ...formData, time })}
                          className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                            formData.time === time
                              ? "bg-primary text-white border-primary"
                              : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />

                  {/* Email */}
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />

                  {/* Phone */}
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />

                  {/* Message */}
                  <textarea
                    placeholder="Additional message (optional)"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
                  />

                  {status === "error" && (
                    <p className="text-sm text-danger text-center">
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Confirm Booking
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
