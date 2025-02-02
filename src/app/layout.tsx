import type { Metadata } from "next";
import { Provider } from "@/components/ui/provider"


export const metadata: Metadata = {
  title: "TrckR",
  description: "TrckR is an energy tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
