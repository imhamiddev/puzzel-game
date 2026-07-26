import clsx from "clsx";

export default function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton rounded-xl", className)} />;
}
