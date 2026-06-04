const groups = [
  ["About", "Mission", "Open source", "Security"],
  ["Products", "Dental AI", "Gym AI", "CRM AI"],
  ["Pricing", "Starter", "Pro", "Enterprise"],
  ["Contact", "GitHub", "Docs", "Support"],
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0B1120]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map(([title, ...items]) => (
          <div key={title}>
            <h2 className="text-sm font-bold text-white">{title}</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {items.map((item) => (
                <li key={item}>
                  <a className="transition hover:text-white" href={item === "Docs" ? "/README.md" : "/"}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-sm text-slate-500">
        © 2026 Elevora AI - Open Source Platform
      </div>
    </footer>
  );
}
