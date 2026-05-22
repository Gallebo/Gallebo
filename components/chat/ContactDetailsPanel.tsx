"use client";

import { useEffect, useState } from "react";

import {
  getContactDetailsAction,
  type ContactDetails,
} from "@/lib/chat/actions";

export function ContactDetailsPanel({
  bookingId,
  viewerRole,
}: {
  bookingId: string;
  viewerRole: "pilot" | "passenger";
}) {
  const [contacts, setContacts] = useState<ContactDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getContactDetailsAction(bookingId);
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setContacts(null);
      } else {
        setContacts(res.contacts ?? null);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading contact details…</p>
    );
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  if (!contacts) return null;

  const other =
    viewerRole === "pilot" ? contacts.passenger : contacts.pilot;
  const self = viewerRole === "pilot" ? contacts.pilot : contacts.passenger;

  return (
    <div className="rounded-md border p-3 space-y-2 text-sm">
      <h4 className="font-medium">Contact details</h4>
      <p>
        <span className="text-muted-foreground">Other party: </span>
        {other.name}
        {other.phone ? (
          <>
            {" · "}
            <a className="text-primary underline" href={`tel:${other.phone}`}>
              {other.phone}
            </a>
          </>
        ) : (
          <span className="text-muted-foreground"> (no phone on file)</span>
        )}
      </p>
      <p className="text-muted-foreground">
        Your number: {self.phone ?? "not set"}
      </p>
    </div>
  );
}
