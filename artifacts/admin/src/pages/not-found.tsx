import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-5xl font-bold text-foreground mb-3">404</div>
        <div className="text-muted-foreground mb-6">Page not found</div>
        <Link href="/" className="text-sm text-primary hover:underline">Go to dashboard</Link>
      </div>
    </div>
  );
}
