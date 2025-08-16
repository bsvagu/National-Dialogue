import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function Header() {
  const [location] = useLocation();
  const pageTitle = pageTitles[location] || "Dashboard";

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex space-x-2 text-sm text-slate-500 mb-1">
            <span>Admin Portal</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">{pageTitle}</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </button>
          <div className="text-right">
            <p className="text-sm text-slate-500">Last login</p>
            <p className="text-xs text-slate-400">Today, 09:15</p>
          </div>
        </div>
      </div>
    </header>
  );
}
