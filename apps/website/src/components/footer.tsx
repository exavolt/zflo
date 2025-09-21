import { Link } from 'react-router';
import { Button } from './ui/button';
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ZFlo. All Rights Reserved.
        </p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/docs">Docs</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/exavolt/zflo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
