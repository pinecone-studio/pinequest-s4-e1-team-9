import ChatMockup from '@/app/landing/components/ChatMockup';
import HeroActions from '@/app/landing/components/HeroActions';

export default function LandingHero() {
  return (
    <section className="px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Private document assistants for teams
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl md:text-6xl">
            Pinequest AI
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Turn private documents into secure, shareable AI assistants that
            teams can use instantly.
          </p>
          <HeroActions />
        </div>
        <ChatMockup />
      </div>
    </section>
  );
}
