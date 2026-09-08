// FaizERP logo - a small colored mark + wordmark.
// Approximates the original `icon-full-color.png` + "FaizERP.id" wordmark style.

export function FaizLogo({
  className,
  variant = "color",
}: {
  className?: string;
  variant?: "color" | "light";
}) {
  // "color" = full-color mark for use on blue hero (multi-color icon).
  // "light" = simplified single-color mark for use on light backgrounds.
  const mark = (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="10"
        fill={variant === "color" ? "#2563eb" : "#2563eb"}
      />
      <path
        d="M14 14h20v6H20v4h10v6H20v8h-6V14Z"
        fill="white"
      />
      <circle cx="34" cy="32" r="4" fill="#0d9488" />
      <circle cx="34" cy="14" r="3" fill="#dc2626" />
    </svg>
  );

  return mark;
}

export function FaizWordmark({
  className,
  variant = "light",
  label,
}: {
  className?: string;
  variant?: "color" | "light";
  label?: string;
}) {
  const textColor = variant === "color" ? "text-white" : "text-foreground";
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <FaizLogo className="h-8 w-8" variant={variant} />
      <span className={`text-lg font-semibold tracking-tight ${textColor}`}>
        FaizERP<span className="opacity-60">.id</span>
      </span>
      {label ? (
        <span className={`ml-2 text-xs ${textColor} opacity-70`}>{label}</span>
      ) : null}
    </div>
  );
}
