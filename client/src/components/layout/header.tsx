import { useLocation } from "wouter";
import { Bell, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard", 
  "/submissions": "Submissions",
  "/cases": "Cases",
  "/users": "Users & Roles",
  "/departments": "Departments",
  "/analytics": "Analytics",
  "/taxonomy": "Taxonomy",
  "/polls": "Polls",
  "/audit": "Audit Log",
  "/settings": "Settings",
};

interface HeaderProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function Header({ onMenuClick, isMobile }: HeaderProps) {
  const [location] = useLocation();
  const pageTitle = pageTitles[location] || "Dashboard";

  return (
    <header className="bg-md-surface border-b border-md-outline-variant px-3 sm:px-6 py-4 shadow-md-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="mr-3 h-8 w-8 text-md-surface-on-variant hover:text-md-surface-on"
              data-testid="mobile-menu-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <nav className="flex space-x-2 mb-1">
              <span className="md-body-medium text-md-surface-on-variant">Admin Portal</span>
              <span className="text-md-outline">/</span>
              <span className="md-body-medium text-md-surface-on font-medium">{pageTitle}</span>
            </nav>
            <h1 className="md-headline-small text-md-surface-on">{pageTitle}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />
          <button 
            className="relative p-2 sm:p-3 text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high transition-all duration-200 rounded-md-full"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 md-label-small bg-md-error text-md-error-on"
            >
              3
            </Badge>
          </button>
          <div className="text-right hidden sm:block">
            <p className="md-body-medium text-md-surface-on-variant">Last login</p>
            <p className="md-body-small text-md-surface-on-variant opacity-75">Today, 09:15</p>
          </div>
        </div>
      </div>
    </header>
  );
}
