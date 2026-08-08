const POINTS = [
  {
    title: "Organic milk",
    desc: "Sourced from one dairy, 40 minutes from the kitchen.",
  },
  {
    title: "No stabilizers",
    desc: "Texture comes from fat and technique, not gum or filler.",
  },
  {
    title: "Compostable cups",
    desc: "Every cone sleeve and cup breaks down within 90 days.",
  },
];

export default function IngredientsStrip() {
  return (
    <section id="story" className="bg-mint/50 py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.title} className="flex gap-4">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-berry" />
            <div>
              <h3 className="font-display text-lg font-semibold text-brown">
                {p.title}
              </h3>
              <p className="mt-1 text-sm text-muted-brown">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
