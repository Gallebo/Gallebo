import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Shield,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Safety & Regulation",
  description:
    "How Gallebo complies with EU Regulation 965/2012 and the EASA Safety Charter for non-commercial cost-sharing flights.",
  alternates: { canonical: "/safety" },
};

const EASA_CHARTER_COMMITMENTS = [
  {
    article: "Article 1",
    title: "Inform passengers about safety levels",
    description:
      "Clearly explain how non-commercial general aviation flights differ from commercial air transport in terms of safety standards and oversight.",
  },
  {
    article: "Article 2",
    title: "Promote a safety-oriented code of conduct",
    description:
      "Actively encourage safe behaviour from both pilots and passengers before, during, and after every shared flight.",
  },
  {
    article: "Article 3",
    title: "Provide pilot safety resources",
    description:
      "Offer checklists, guidance, and tutorials on safety best practices so pilots can prepare properly for passenger flights.",
  },
  {
    article: "Article 4",
    title: "Share accurate flight information",
    description:
      "Give passengers meaningful information about the aircraft type and the pilot's current experience and qualifications.",
  },
  {
    article: "Article 5",
    title: "Foster community safety dialogue",
    description:
      "Provide a forum where the GA community can share and discuss safety best practices.",
  },
  {
    article: "Article 6",
    title: "Share safety-related data",
    description:
      "Collect data on flights, aircraft, and pilot profiles, and share relevant information with EASA and national competent authorities.",
  },
  {
    article: "Article 7",
    title: "Annual charter review",
    description:
      "Meet annually with EASA and national authorities to review implementation of the Charter and improve safety outcomes.",
  },
] as const;

const PILOT_CHECKLIST = [
  "Conduct a pre-flight briefing with all passengers",
  "Check weather and NOTAMs for the planned route",
  "Confirm accurate passenger weight declarations for W&B",
  "Verify valid aircraft insurance covering cost-shared flights",
] as const;

const PASSENGER_RULES = [
  "Follow the pilot's instructions at all times — they are the commander of the aircraft",
  "Declare your weight accurately when booking — incorrect figures affect flight safety",
  "Do not bring dangerous goods, weapons, or prohibited items on board",
  "Arrive on time at the agreed meeting point — delays affect fuel planning and slot coordination",
  "No smoking on board or near the aircraft",
  "Keep your seatbelt fastened unless the pilot instructs otherwise",
] as const;

const GA_VS_COMMERCIAL = [
  "You fly in a light private aircraft, not a scheduled airliner",
  "The pilot holds a private licence (PPL/LAPL), not a commercial airline rating",
  "There is no cabin crew — the pilot manages all safety duties",
  "Routes and schedules are flexible and weather-dependent",
  "Costs are shared equally; this is not a charter or ticketed service",
] as const;

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-2xl space-y-3">
      <p
        className="text-xs font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--ink-3)" }}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className="text-2xl font-bold tracking-tight sm:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
      <CheckCircle2
        className="mt-0.5 size-4 shrink-0"
        style={{ color: "var(--primary-v2)" }}
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

export default function SafetyPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section
        className="border-b"
        style={{
          borderColor: "var(--line)",
          background: "var(--surface)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl space-y-5">
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <Shield className="size-3" aria-hidden="true" />
              EASA Safety Charter
            </Badge>
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Safety &amp; Regulation
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Gallebo is built for legal, non-commercial cost-sharing under EU
              law. Transparency, verification, and shared responsibility keep
              every flight within the rules.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {/* Regulation */}
        <section id="regulation" aria-labelledby="regulation-heading">
          <SectionHeading
            id="regulation-heading"
            eyebrow="Legal framework"
            title="Regulation"
            description="Flight sharing is permitted across the European Union when conducted as genuine cost-sharing — not as a commercial air transport operation."
          />
          <Card>
            <CardHeader>
              <CardTitle>EU Regulation 965/2012 (Part-NCO)</CardTitle>
              <CardDescription>
                Non-commercial operations with complex motor-powered aircraft
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Under EU Reg. 965/2012, private pilots may advertise and conduct
                cost-shared flights in non-complex aircraft carrying no more than{" "}
                <strong className="font-medium text-foreground">
                  6 persons including the pilot
                </strong>
                . Passengers may contribute only to the{" "}
                <strong className="font-medium text-foreground">
                  direct costs
                </strong>{" "}
                of the flight — fuel, landing fees, airfield charges, and similar
                expenses. The pilot must pay their own proportional share and may
                not profit from the arrangement.
              </p>
              <p>
                Gallebo enforces these limits in product design: flight capacity
                caps, cost-sharing formulas locked at posting time, and pilot
                verification before any listing goes live.
              </p>
              <p>
                <Link
                  href="https://www.easa.europa.eu/en/domains/general-aviation/operations-general-aviation/charter-promote-safety-non-commercial-general-aviation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                >
                  Official EASA cost-sharing guidance
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* EASA Safety Charter */}
        <section id="charter" aria-labelledby="charter-heading">
          <SectionHeading
            id="charter-heading"
            eyebrow="Platform commitments"
            title="EASA Safety Charter"
            description="Gallebo has signed the EASA Charter to promote the safety of non-commercial general aviation flights with light aircraft. These are our binding commitments as a platform."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {EASA_CHARTER_COMMITMENTS.map((item) => (
              <Card key={item.article} className="h-full">
                <CardHeader className="pb-2">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {item.article}
                  </p>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* For Pilots */}
        <section id="pilots" aria-labelledby="pilots-heading">
          <SectionHeading
            id="pilots-heading"
            eyebrow="Pilot responsibilities"
            title="For Pilots"
            description="Before every cost-shared flight, complete these safety steps. Gallebo verification covers identity and licence — operational safety remains your responsibility as pilot in command."
          />
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <Card>
              <CardHeader>
                <CardTitle>Pre-flight safety checklist</CardTitle>
                <CardDescription>
                  Minimum steps before passengers board
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {PILOT_CHECKLIST.map((item) => (
                    <ChecklistItem key={item}>{item}</ChecklistItem>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="lg:max-w-sm">
              <CardHeader>
                <CardTitle>EASA pilot checklist</CardTitle>
                <CardDescription>
                  Official guidance for passenger communication and logistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Download the EASA-recommended checklist covering passenger
                  briefings, weight &amp; balance, and pre-departure procedures.
                </p>
                <a
                  href="/gallebo-pilot-checklist.pdf"
                  download
                  className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
                >
                  <Download aria-hidden="true" />
                  Download PDF
                </a>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Passengers */}
        <section id="passengers" aria-labelledby="passengers-heading">
          <SectionHeading
            id="passengers-heading"
            eyebrow="Passenger guidance"
            title="For Passengers"
            description="A cost-shared GA flight is a different experience from commercial air travel. Know what to expect and how to help keep the flight safe."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GA flight vs commercial</CardTitle>
                <CardDescription>What makes cost-sharing different</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {GA_VS_COMMERCIAL.map((item) => (
                    <ChecklistItem key={item}>{item}</ChecklistItem>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Passenger code of conduct</CardTitle>
                <CardDescription>Rules every passenger must follow</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {PASSENGER_RULES.map((item) => (
                    <ChecklistItem key={item}>{item}</ChecklistItem>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Community */}
        <section id="community" aria-labelledby="community-heading">
          <SectionHeading
            id="community-heading"
            eyebrow="Together"
            title="Community"
            description="Safety improves when pilots and passengers share knowledge. Gallebo is building a space to exchange best practices across the Adriatic GA community."
          />
          <Card
            className="overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)",
            }}
          >
            <CardContent className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                    color: "var(--primary-v2)",
                  }}
                >
                  <Users className="size-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Join the conversation
                  </p>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                    Our community channel for safety tips, route advice, and
                    platform updates is coming soon. Check back here for the
                    Discord link.
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled className="shrink-0">
                Community link — coming soon
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
