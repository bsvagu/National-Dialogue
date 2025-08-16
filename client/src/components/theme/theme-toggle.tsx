import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 bg-md-surface-container hover:bg-md-surface-container-high border-md-outline-variant"
          data-testid="button-theme-toggle"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-md-surface-container border-md-outline-variant"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="hover:bg-md-surface-container-high focus:bg-md-surface-container-high text-md-surface-on"
          data-testid="menu-theme-light"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="md-body-medium">Light</span>
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="hover:bg-md-surface-container-high focus:bg-md-surface-container-high text-md-surface-on"
          data-testid="menu-theme-dark"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="md-body-medium">Dark</span>
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="hover:bg-md-surface-container-high focus:bg-md-surface-container-high text-md-surface-on"
          data-testid="menu-theme-system"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="md-body-medium">System</span>
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}