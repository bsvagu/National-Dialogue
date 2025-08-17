import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-md-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300" 
        style={{ marginLeft: isSidebarCollapsed ? '64px' : '288px' }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto bg-md-surface-container-lowest p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
