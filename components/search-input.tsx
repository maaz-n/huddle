import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchInput({ 
  placeholder = "Search...", 
  onChange,
  className 
}: { 
  placeholder?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  className?: string
}) {
  return (
    <div className={`relative w-full sm:max-w-xs group ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      
      <Input
        type="search"
        placeholder={placeholder}
        onChange={onChange}
        className="pl-10 h-10 bg-muted/20 border-border/60 focus-visible:ring-primary/20 focus-visible:bg-background transition-all"
      />
    </div>
  )
}