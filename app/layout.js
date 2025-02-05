import "../styles/globals.css";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kaz's Dev Diary",
  description: "Blog description",
};

export default function RootLayout({ children }) {
  const currentTime = new Date();
  // eslint-disable-next-line no-console
  console.log(`1. debug_RootLayout : ${currentTime}`);
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
