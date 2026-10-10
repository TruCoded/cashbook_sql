import { Wallet, Users, RefreshCw, FileText, ShieldCheck } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { CinematicSequence } from "@/components/landing/cinematic-sequence";
import { FeatureSection } from "@/components/landing/feature-section";
import { TrackCashVisual, CollaborateVisual, PdfVisual, SecurityVisual } from "@/components/landing/visuals";
import { CtaSection, LandingFooter } from "@/components/landing/cta";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <LandingNavbar />
      <Hero />
      <CinematicSequence />

      <FeatureSection
        eyebrow="Track"
        title="Every rupee, accounted for"
        description="Log cash in and cash out in seconds. Balances are always computed from your ledger — never a number you have to trust blindly."
        icon={<Wallet size={20} />}
        points={["Cash in / cash out with person, category & notes", "Search and filter your full history", "Balance = initial + cash in − cash out, always"]}
        visual={<TrackCashVisual />}
      />

      <FeatureSection
        eyebrow="Partners"
        id="partners"
        title="Add a partner with their Gmail"
        description="Type your partner's Gmail, they receive a one-time code, you enter it — and they can see your cashbook on their own dashboard."
        icon={<Users size={20} />}
        points={["Partner is confirmed by a code sent to their Gmail", "Choose view-only or can-add-cash permission", "You stay the owner and can remove a partner anytime"]}
        reverse
        visual={<CollaborateVisual />}
      />

      <FeatureSection
        eyebrow="Stay in sync"
        id="sync"
        title="Both dashboards, always current"
        description="Add cash in or cash out and your partner sees it moments later. Whatever your partner records shows up on yours too."
        icon={<RefreshCw size={20} />}
        points={["Live balance & ledger updates for everyone", "Works the same on mobile and desktop", "Every action shows in the activity feed"]}
        visual={<TrackCashVisual />}
      />

      <FeatureSection
        eyebrow="PDF copies"
        id="pdf"
        title="A statement in every inbox"
        description="Every cash in, cash out or delete sends a fresh PDF copy of the cashbook to you and your partners by email. New partners get one the moment they join."
        icon={<FileText size={20} />}
        points={["PDF with balance, history and running balance", "Sent to the owner and all partners, whoever made the change", "Download the PDF anytime from the cashbook page"]}
        reverse
        visual={<PdfVisual />}
      />

      <FeatureSection
        eyebrow="Security"
        id="security"
        title="Built to keep your books private"
        description="A one-time code emailed to your Gmail to sign in, private sessions, and a server-side permission check on every request."
        icon={<ShieldCheck size={20} />}
        points={["Sign in with a Gmail code — no passwords to forget", "Every cashbook access is checked on the server", "Activity log of every action across your cashbooks"]}
        visual={<SecurityVisual />}
      />

      <CtaSection />
      <LandingFooter />
    </div>
  );
}
