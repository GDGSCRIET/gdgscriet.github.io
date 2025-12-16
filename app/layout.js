import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LetterGlitch from "@/components/LetterGlitch";
import { Navbar } from "@/components/ui/resizable-navbar";
import Header from "@/components/Header";
// import PillNav from "@/components/PillNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GDG SCRIET - Google Developer Group",
  description: "Official website of GDG SCRIET - Building a community of developers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <div className="relative bg-black">
          {/* <div className="-z-10 fixed overflow-hidden h-screen w-screen top-0 left-0">
          <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          />
          </div> */}
         
          {/* <Navbar /> */}
          <Header/>
          <div className="h-14"></div>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
