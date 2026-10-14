interface HeroProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}

export function Hero({ eyebrow, title, description }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="hero-backdrop border-b-2 border-brand-600">
      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 md:py-16">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-[0.14em] text-brand-300 uppercase">
            {eyebrow}
          </p>
        )}
        <h1
          id="hero-title"
          className="mt-3 max-w-3xl text-[2rem] leading-[1.1] font-bold tracking-[-0.025em] text-balance text-white sm:text-4xl md:text-5xl"
        >
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-neutral-300 md:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
