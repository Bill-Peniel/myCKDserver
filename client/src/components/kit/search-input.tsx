import { forwardRef } from "react";
import { Search } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Champ de recherche avec icône (filtres de listes) */
export const SearchInput = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <div className={cn("relative w-full", className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input ref={ref} type="search" className="pl-9" {...props} />
  </div>
));
SearchInput.displayName = "SearchInput";
