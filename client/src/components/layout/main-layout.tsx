import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-md-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '288px' }}>
        <Header />
        <main className="flex-1 overflow-y-auto bg-md-surface-container-lowest p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
