export default function DripDivider({
  color = "#980B39",
  flip = false,
}: {
  color?: string;
  flip?: boolean;
}) {
  return (
    <div
      className={`w-full ${flip ? "rotate-180" : ""} -mt-[1px] relative z-30`}
      style={{ lineHeight: 0 }}
    >
      <svg
        viewBox="0 0 1440 150"
        className="w-full h-[60px] md:h-[120px]"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 L1440,0 L1440,60 Q1350,120 1260,60 T1080,60 T900,60 T720,60 T540,60 T360,60 T180,60 T0,60 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}
