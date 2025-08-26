import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getMainMargin = () => {
    if (isMobile) return '0px';
    return isSidebarCollapsed ? '80px' : '288px';
  };

  return (
    <div className="flex h-screen bg-md-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleSidebar}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300" 
        style={{ marginLeft: getMainMargin() }}
      >
        <Header onMenuClick={toggleSidebar} isMobile={isMobile} />
        <main className="flex-1 overflow-y-auto bg-md-surface-container-lowest p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
