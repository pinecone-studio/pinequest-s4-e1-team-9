import HowItWorksSection from '@/app/landing/components/HowItWorkScreenSection';
import LandingFooter from '@/app/landing/components/LandingFooter';
import LandingHeader from '@/app/landing/components/LandingHeader';
import LandingHero from '@/app/landing/components/LandingHero';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <LandingHeader />

      <main className="flex-grow">
        <LandingHero />
        <HowItWorksSection />
      </main>

      <LandingFooter />
    </div>
  );
}
