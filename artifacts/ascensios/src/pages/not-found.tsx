import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you are looking for doesn't exist or hasn't been fully implemented yet.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button size="lg">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
