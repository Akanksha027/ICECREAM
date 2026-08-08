const WORDS = [
  "Real fruit",
  "Small batch",
  "No shortcuts",
  "Baked daily",
  "Hand-scooped",
  "Since 2019",
];

export default function Ticker() {
  const loop = [...WORDS, ...WORDS];
  return (
    <div className="relative overflow-hidden border-y-2 border-[#D7B9C1] bg-[#E8CDD3] py-4">
      <div className="flex w-max animate-marquee gap-10">
        {loop.map((w, i) => (
          <div key={i} className="flex items-center gap-10 shrink-0">
            <span className="font-display text-2xl md:text-3xl italic text-[#980B39] font-medium tracking-wide whitespace-nowrap">
              {w}
            </span>
            <span className="h-2 w-2 rounded-full bg-[#980B39]" />
          </div>
        ))}
      </div>
    </div>
  );
}
