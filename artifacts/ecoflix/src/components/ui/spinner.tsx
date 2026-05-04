import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
