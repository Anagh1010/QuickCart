import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-jetbrains-mono' 
})

export const metadata = {
  title: "QuickCart",
  description: "E-Commerce with Next.js ",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${jetbrainsMono.className} ${jetbrainsMono.variable} antialiased text-gray-700`} >
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
          <Toaster />
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
