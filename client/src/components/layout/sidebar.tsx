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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, isMobile, isOpen, onClose }: SidebarProps) {
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
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "bg-md-surface-container flex flex-col shadow-md-2 fixed left-0 top-0 h-full z-50 transition-all duration-300",
        isMobile 
          ? cn(
              "w-72",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )
          : cn(
              isCollapsed ? "w-20" : "w-72"
            )
      )}>
      {/* Logo and Toggle - Material Design 3 */}
      <div className="p-4 border-b border-md-outline-variant">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-md-primary rounded-md-base flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-md-primary-on" />
            </div>
            {(!isCollapsed || isMobile) && (
              <div>
                <h1 className="md-title-large text-md-surface-on">National Dialogue</h1>
                <p className="md-body-small text-md-surface-on-variant">Admin Portal</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={isMobile ? onClose : onToggle}
            className="h-8 w-8 text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high"
            data-testid="sidebar-toggle"
          >
            {isMobile ? (
              <ChevronLeft className="h-4 w-4" />
            ) : isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Navigation - Material Design 3 */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center rounded-md-lg transition-all duration-200",
                isCollapsed && !isMobile ? "justify-center px-2 py-4" : "space-x-3 px-3 py-3 md-label-large",
                isActive 
                  ? "bg-md-primary-container text-md-primary-on-container shadow-md-1" 
                  : "text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high"
              )}
              data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              title={isCollapsed && !isMobile ? item.name : undefined}
            >
              <Icon className={cn(
                "transition-all duration-200",
                isCollapsed && !isMobile ? "h-6 w-6" : "h-5 w-5"
              )} />
              {(!isCollapsed || isMobile) && (
                <>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-md-error text-md-error-on md-label-small px-2 py-1 rounded-md-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {/* Management Section */}
        <div className="pt-6 border-t border-md-outline-variant mt-4">
          {(!isCollapsed || isMobile) && (
            <h3 className="md-label-small text-md-surface-on-variant uppercase tracking-wider mb-3 px-3">
              Management
            </h3>
          )}
          {managementNav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "flex items-center rounded-md-lg transition-all duration-200",
                  isCollapsed && !isMobile ? "justify-center px-2 py-4" : "space-x-3 px-3 py-3 md-label-large",
                  isActive 
                    ? "bg-md-secondary-container text-md-secondary-on-container shadow-md-1" 
                    : "text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                title={isCollapsed && !isMobile ? item.name : undefined}
              >
                <Icon className={cn(
                  "transition-all duration-200",
                  isCollapsed && !isMobile ? "h-6 w-6" : "h-5 w-5"
                )} />
                {(!isCollapsed || isMobile) && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* System Section */}
        <div className="pt-6 border-t border-md-outline-variant mt-4">
          {systemNav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "flex items-center rounded-md-lg transition-all duration-200",
                  isCollapsed && !isMobile ? "justify-center px-2 py-4" : "space-x-3 px-3 py-3 md-label-large",
                  isActive 
                    ? "bg-md-tertiary-container text-md-tertiary-on-container shadow-md-1" 
                    : "text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                title={isCollapsed && !isMobile ? item.name : undefined}
              >
                <Icon className={cn(
                  "transition-all duration-200",
                  isCollapsed && !isMobile ? "h-6 w-6" : "h-5 w-5"
                )} />
                {(!isCollapsed || isMobile) && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile - Material Design 3 */}
      <div className="p-4 border-t border-md-outline-variant bg-md-surface-container-low">
        {isCollapsed && !isMobile ? (
          /* Collapsed state - Stack vertically */
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 bg-md-primary rounded-md-full flex items-center justify-center">
              <span className="md-label-large text-md-primary-on">
                {user ? getInitials(user.name) : "U"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high transition-all duration-200 rounded-md-full"
              title="Sign out"
              data-testid="button-logout-collapsed"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          /* Expanded state - Horizontal layout */
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-md-primary rounded-md-full flex items-center justify-center">
              <span className="md-label-large text-md-primary-on">
                {user ? getInitials(user.name) : "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="md-body-medium text-md-surface-on truncate font-medium">
                {user?.name || "User"}
              </p>
              <p className="md-body-small text-md-surface-on-variant">
                {user?.roles[0] || "Role"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high transition-all duration-200 rounded-md-full"
              title="Sign out"
              data-testid="button-logout-expanded"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
