"use client";

import { LifeBuoy, Star } from "lucide-react";

// Structural shape — satisfied by both the static StarMentalModel and a card's
// own CardMentalModel (neither title nor key is used here).
type RenderableMentalModel = {
  spine: string;
  beats: { hook: string; say: string; crux?: boolean }[];
};

// Full literal Tailwind classes only (no dynamic construction), so the arch
// accent palette survives the build — same convention as MockInterviewTab /
// TeleprompterTab.
const BEAT_ACCENTS = ["blue", "purple", "teal", "green", "coral", "amber"] as const;
type BeatAccent = (typeof BEAT_ACCENTS)[number];

const CHIP: Record<BeatAccent, string> = {
  blue: "bg-arch-blue/15 text-arch-blue border-arch-blue/30",
  purple: "bg-arch-purple/15 text-arch-purple border-arch-purple/30",
  teal: "bg-arch-teal/15 text-arch-teal border-arch-teal/30",
  green: "bg-arch-green/15 text-arch-green border-arch-green/30",
  coral: "bg-arch-coral/15 text-arch-coral border-arch-coral/30",
  amber: "bg-arch-amber/15 text-arch-amber border-arch-amber/30",
};
const DOT: Record<BeatAccent, string> = {
  blue: "bg-arch-blue ring-arch-blue/30",
  purple: "bg-arch-purple ring-arch-purple/30",
  teal: "bg-arch-teal ring-arch-teal/30",
  green: "bg-arch-green ring-arch-green/30",
  coral: "bg-arch-coral ring-arch-coral/30",
  amber: "bg-arch-amber ring-arch-amber/30",
};

export default function StarMentalModelView({
  model,
  variant = "compact",
}: {
  model: RenderableMentalModel;
  variant?: "compact" | "presentation";
}) {
  const big = variant === "presentation";

  const hasSpine = model.spine?.trim().length > 0;

  return (
    <div className={big ? "flex flex-col gap-7" : "flex flex-col gap-4"}>
      {/* The spine — your fallback if you blank (omitted when empty) */}
      {hasSpine && (
      <div className="rounded-xl border border-arch-amber/30 bg-arch-amber/10 px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <LifeBuoy className={`${big ? "size-4" : "size-3"} text-arch-amber`} />
          <span
            className={`font-semibold uppercase tracking-wider text-arch-amber ${
              big ? "text-[12px]" : "text-[9.5px]"
            }`}
          >
            The spine — if you blank
          </span>
        </div>
        <p
          className={`leading-relaxed text-arch-text ${
            big ? "text-[20px] md:text-[24px]" : "text-[12.5px]"
          }`}
        >
          {model.spine}
        </p>
      </div>
      )}

      {/* The shape — named beats, one hook each */}
      <ol className={big ? "flex flex-col gap-5" : "flex flex-col gap-3"}>
        {model.beats.map((beat, i) => {
          const accent = BEAT_ACCENTS[i % BEAT_ACCENTS.length];
          const isLast = i === model.beats.length - 1;
          return (
            <li key={i} className="flex gap-3">
              {/* Number rail + connecting line (the "shape") */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full text-white font-bold ${
                    DOT[accent]
                  } ${beat.crux ? "ring-2" : ""} ${
                    big ? "size-8 text-[14px]" : "size-6 text-[11px]"
                  }`}
                >
                  {i + 1}
                </span>
                {!isLast && (
                  <span
                    className={`mt-1 w-px flex-1 ${DOT[accent]} opacity-30`}
                    aria-hidden
                  />
                )}
              </div>

              {/* Hook + the line you say */}
              <div className={`min-w-0 flex-1 ${big ? "pb-1" : "pb-0.5"}`}>
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-md border font-bold uppercase tracking-wide ${
                      CHIP[accent]
                    } ${beat.crux ? "ring-1 ring-inset" : ""} ${
                      big ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[10px]"
                    }`}
                  >
                    {beat.hook}
                  </span>
                  {beat.crux && (
                    <Star
                      className={`fill-arch-amber text-arch-amber ${
                        big ? "size-4" : "size-3"
                      }`}
                    />
                  )}
                </div>
                <p
                  className={`leading-relaxed text-arch-text2 ${
                    big ? "text-[18px] md:text-[22px]" : "text-[12px]"
                  }`}
                >
                  {beat.say}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
