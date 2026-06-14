import HowItWorksSection from '@/app/landing/components/HowItWorkScreenSection';
import LandingFooter from '@/app/landing/components/LandingFooter';
import LandingHeader from '@/app/landing/components/LandingHeader';
import LandingHero from '@/app/landing/components/LandingHero';

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground antialiased min-h-screen flex flex-col font-['Inter']">
      <LandingHeader />

      <main className="flex-grow">
        <LandingHero />
        <HowItWorksSection />
      </main>

      <LandingFooter />
    </div>
  );
}
