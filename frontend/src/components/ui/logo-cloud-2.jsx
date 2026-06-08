import { PlusIcon } from "lucide-react";
import { cn } from "../../lib/utils.js";

const logos = [
  {
    src: "/assets/logos/mindtickle.svg",
    alt: "Mindtickle logo",
    name: "Mindtickle",
    location: "Pune",
    className: "relative border-r border-b border-white/10 bg-transparent",
    plus: "right",
  },
  {
    src: "/assets/logos/elasticrun.svg",
    alt: "ElasticRun logo",
    name: "ElasticRun",
    location: "Pune",
    className: "border-b border-white/10 md:border-r bg-transparent",
  },
  {
    src: "/assets/logos/webengage.svg",
    alt: "WebEngage logo",
    name: "WebEngage",
    location: "Mumbai",
    className: "relative border-r border-b border-white/10 bg-transparent",
    plus: "both",
  },
  {
    src: "/assets/logos/browserstack.svg",
    alt: "BrowserStack logo",
    name: "BrowserStack",
    location: "Mumbai",
    className: "border-b border-white/10 bg-transparent",
  },
  {
    src: "/assets/logos/clevertap.svg",
    alt: "CleverTap logo",
    name: "CleverTap",
    location: "Mumbai",
    className: "relative border-r border-white/10 bg-transparent",
    plus: "mobile",
  },
  {
    src: "/assets/logos/razorpay.svg",
    alt: "Razorpay logo",
    name: "Razorpay",
    location: "Bengaluru",
    className: "border-b border-white/10 bg-transparent md:border-r md:border-b-0",
  },
  {
    src: "/assets/logos/fiveleaf.svg",
    alt: "Fiveleaf logo",
    name: "Fiveleaf",
    location: "UK",
    className: "border-r border-white/10 bg-transparent",
  },
  {
    src: "/assets/logos/elevora.svg",
    alt: "Elevora AI logo",
    name: "Your company",
    location: "Next",
    className: "bg-transparent",
  },
];

export function LogoCloud({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative grid grid-cols-2 rounded-2xl border border-white/10 bg-[#1e1e2e]/30 backdrop-blur-md md:grid-cols-4 overflow-hidden",
        className
      )}
      {...props}
    >
      {logos.map((logo) => (
        <LogoCard className={logo.className} logo={logo} key={logo.name}>
          {logo.plus === "right" ? <PlusMark className="-right-[12.5px] -bottom-[12.5px]" /> : null}
          {logo.plus === "both" ? (
            <>
              <PlusMark className="-right-[12.5px] -bottom-[12.5px]" />
              <PlusMark className="-bottom-[12.5px] -left-[12.5px] hidden md:block" />
            </>
          ) : null}
          {logo.plus === "mobile" ? <PlusMark className="-right-[12.5px] -bottom-[12.5px] md:-left-[12.5px] md:right-auto" /> : null}
        </LogoCard>
      ))}
    </div>
  );
}

function LogoCard({ logo, className, children, ...props }) {
  return (
    <div
      className={cn("flex min-h-28 items-center justify-center border-white/10 px-4 py-8 md:p-8", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <img
          alt={logo.alt}
          className="pointer-events-none size-8 select-none rounded-md object-contain bg-white/5 p-1"
          loading="lazy"
          src={logo.src}
        />
        <div className="text-left">
          <p className="font-['Space_Grotesk'] text-lg font-black leading-none tracking-tight text-white">{logo.name}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b8ba8]">{logo.location}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PlusMark({ className }) {
  return <PlusIcon className={cn("absolute z-10 size-6 text-white/25", className)} strokeWidth={1} />;
}
