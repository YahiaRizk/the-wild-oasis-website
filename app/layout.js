import Logo from "@/app/_components/Logo";
import Navigation from "@/app/_components/navigation";

export const metadata = {
  title: "The Wild Oasis",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <header>
          <Logo />
          <Navigation />
        </header>
        <main>{children}</main>
        <footer>Copyright to the wild oasis</footer>
      </body>
    </html>
  );
}
