import { Providers } from "@/components/Providers";
import { TopNav } from "@/components/TopNav";
import { SideNav } from "@/components/SideNav";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Toaster } from "sonner";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <div className="top-nav">
              <TopNav />
            </div>
            <div className="mobile-nav">
              <SideNav />
            </div>
            <main className="pb-16 md:pb-0 md:ml-32">
              {children}
            </main>
            <div className="mobile-nav">
              <MobileBottomNav />
            </div>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}