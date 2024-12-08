'use client';
import { Inter } from "next/font/google";
import Header from './components/Header';
import Footer from './components/Footer';
import { MetaMaskProvider } from './context/MetaMaskContext';
import { NotificationProvider } from './context/NotificationContext'; // Import NotificationProvider
import { usePathname } from "next/navigation"; // Hook to get the current path
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname(); // Get the current path

  // Check if the current page is the profile completion page
  const isCompleteProfilePage = pathname === "/complete-profile"; // Match exact path

  return (
    <html lang="en">
      <body className="bg-primary text-white">
        <MetaMaskProvider>
          <NotificationProvider> {/* Wrap with NotificationProvider */}
            {!isCompleteProfilePage && <Header />}
            <main className="w-full">{children}</main>
            {!isCompleteProfilePage && <Footer />}
          </NotificationProvider>
        </MetaMaskProvider>
      </body>
    </html>
  );
}
