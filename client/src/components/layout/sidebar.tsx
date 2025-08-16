import { Link, useLocation } from "wouter";
import { useLogout, useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  MessageCircle, 
  BarChart3, 
  Inbox, 
  Briefcase, 
  TrendingUp,
  Users, 
  Building, 
  Tags, 
  BarChart2, 
  History, 
  Settings, 
  LogOut 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Submissions", href: "/submissions", icon: Inbox, badge: "23" },
  { name: "Cases", href: "/cases", icon: Briefcase, badge: "7" },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
];

const managementNav = [
  { name: "Users & Roles", href: "/users", icon: Users },
  { name: "Departments", href: "/departments", icon: Building },
  { name: "Taxonomy", href: "/taxonomy", icon: Tags },
  { name: "Polls", href: "/polls", icon: BarChart2 },
];

const systemNav = [
  { name: "Audit Log", href: "/audit", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-72 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">National Dialogue</h1>
            <p className="text-sm text-slate-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-700 text-white" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
              data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Management Section */}
        <div className="pt-4 border-t border-slate-700 mt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Management
          </h3>
          {managementNav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-700 text-white" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* System Section */}
        <div className="pt-4 border-t border-slate-700 mt-4">
          {systemNav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-700 text-white" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">
              {user ? getInitials(user.name) : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-400">
              {user?.roles[0] || "Role"}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Sign out"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
