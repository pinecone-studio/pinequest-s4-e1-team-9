import ChatMockup from '@/app/landing/components/ChatMockup';
import HeroActions from '@/app/landing/components/HeroActions';
import LightRays from '@/components/LightRays';

export default function LandingHero() {
  return (
    <section className="relative pt-10 pb-10 md:pt-24 md:pb-32 px-6 overflow-hidden">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <span className="inline-block py-1 px-3 rounded-full bg-secondary border border-border text-muted-foreground text-xs tracking-wide mb-6">
          Private AI assistants for internal company knowledge
        </span>
        <h1 className="font-bold text-4xl md:text-[56px] md:leading-[64px] text-foreground max-w-4xl mx-auto tracking-tight mb-6">
          Your company documents,
          <br />
          answered instantly.
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
          Create a secure AI assistant from PDFs, policies, manuals, and
          internal documents. Employees get clear answers with sources from
          approved company files.
        </p>
        <HeroActions />
        <ChatMockup />
      </div>
    </section>
  );
}
