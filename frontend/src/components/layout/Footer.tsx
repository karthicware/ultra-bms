import Link from 'next/link';
import Logo from '@/assets/svg/logo';

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-3 px-4 py-3 text-sm whitespace-nowrap max-lg:flex-col sm:px-6 lg:gap-6">
      <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
        Settings
      </Link>
      <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
        Terms & Conditions
      </Link>
      <Link href="/dashboard" className="max-md:-order-1">
        <Logo className="[&_line]:stroke-background [&_path]:stroke-background dark:[&_rect]:fill-primary [&_rect]:fill-primary" />
      </Link>
      <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
        Privacy Policy
      </Link>
      <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
        Contact
      </Link>
    </footer>
  );
}
