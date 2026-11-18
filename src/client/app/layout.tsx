import { STORE_NAME } from "./lib/constants/config";
import "./globals.css";
import ClientProviders from "./ClientProviders";

export const metadata = {
  title: STORE_NAME,
  description: "Игровые диски, периферия и аксессуары для вашей игровой станции",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
