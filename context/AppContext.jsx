// context/AppContext.jsx

import React, { createContext, useContext, useState } from "react";
import { useTranslation } from "../src/i18n/index.js";

const AppContext = createContext();

export function AppProvider({ children }) {
  const { t } = useTranslation();

  const [jobs, setJobs] = useState([
    { id: "job_1", title: "Pipe Repair", clientName: "John Doe", clientEmail: "john@example.com", clientPhone: "+123456789", status: "in_progress", amount: 150 }
  ]);

  const [invoices, setInvoices] = useState([]);
  
  const [bookings, setBookings] = useState([
    { id: "book_1", clientName: "Alice Smith", date: "2026-08-15", time: "10:00 AM", status: "pending" }
  ]);

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /* ACTION 1: Mark Job as Done & Auto-generate Invoice */
  const completeJob = (jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "completed" } : j))
    );

    const newInvoice = {
      id: `inv_${Date.now()}`,
      jobId: job.id,
      clientName: job.clientName,
      clientEmail: job.clientEmail,
      clientPhone: job.clientPhone,
      amount: job.amount,
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    addToast(t("notifications.jobCompletedAndInvoiceSent"));
  };

  /* ACTION 2: Accept Booking Slot */
  const acceptBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b))
    );

    addToast(t("notifications.bookingConfirmed"));
  };

  return (
    <AppContext.Provider
      value={{
        jobs,
        invoices,
        bookings,
        toasts,
        completeJob,
        acceptBooking,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}