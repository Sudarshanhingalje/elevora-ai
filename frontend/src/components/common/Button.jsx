import { Link } from "react-router-dom";

const variants = {
  primary: "border border-[#6366F1] bg-[#6366F1] text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500",
  secondary: "border border-slate-600 bg-slate-950/40 text-slate-100 hover:border-indigo-300 hover:bg-slate-800",
  ghost: "border border-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
};

export default function Button({ to, href, variant = "primary", className = "", children, ...props }) {
  const classes = `inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={props.type ?? "button"} {...props}>
      {children}
    </button>
  );
}
