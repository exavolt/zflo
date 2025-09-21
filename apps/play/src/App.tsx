import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router';
import { ZFFlow } from '@zflo/core';
import { Moon, Sun, FileText, Sparkles, Globe } from 'lucide-react';
import { FlowchartPlayer } from './components/flowchart-player';
import { SharedFlows } from './components/shared-flows';
import { IntegratedFlowPlayer } from './components/integrated-flow-player';
import { FlowPlayerPage } from './pages/flow-player-page';
import { useTheme } from './lib/use-theme';
import './lib/supabase'; // Initialize Supabase
import { Button } from './components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';

const navLinks = [
  {
    path: '/flowchart-player',
    label: 'Flowchart Player',
    icon: FileText,
  },
  {
    path: '/explore',
    label: 'Community Flows',
    icon: Globe,
  },
];

function App() {
  const [customMermaid, setCustomMermaid] = useState('');
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentFlowchart, setCurrentFlowchart] = useState<ZFFlow | null>(null);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [enableTypingAnimation, setEnableTypingAnimation] = useState(false);

  const handlePlayCustom = (flowchart: ZFFlow, showFlowchart?: boolean) => {
    setEnableTypingAnimation(false);
    setShowFlowchart(!!showFlowchart);
    setCurrentFlowchart(flowchart);
    setIsPlayerOpen(true);
  };

  const handleComplete = (finalState: Record<string, unknown>) => {
    console.log('Flowchart completed:', finalState);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">ZFlo Demo</h1>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon /> : <Sun />}
          </Button>
        </header>

        {/* Navigation */}
        <nav className="mb-8 -mx-4 px-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-max border-b">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
                  location.pathname === path
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/flowchart-player" replace />}
          />
          <Route
            path="/flowchart-player"
            element={
              <FlowchartPlayer
                value={customMermaid}
                onChange={setCustomMermaid}
                onPlay={handlePlayCustom}
                theme={theme}
              />
            }
          />
          <Route path="/explore" element={<SharedFlows />} />
          <Route path="/play/:id" element={<FlowPlayerPage />} />
          <Route path="/play" element={<FlowPlayerPage />} />
        </Routes>

        {/* Fullscreen Dialog Player */}
        <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
          <DialogContent className="w-[90vw] sm:max-w-[90vw] h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentFlowchart?.title || 'Flowchart Player'}
              </DialogTitle>
            </DialogHeader>
            <div className="h-full">
              {currentFlowchart && (
                <IntegratedFlowPlayer
                  flowchart={currentFlowchart}
                  showFlowchart={showFlowchart}
                  onComplete={handleComplete}
                  enableTypingAnimation={enableTypingAnimation}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-6">
        <div className=" border-t bg-muted/50 py-6">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>
              Built with <strong className="text-foreground">ZFlo</strong> —
              Have any questions?{' '}
              <a
                href="https://discordapp.com/users/297276263322746881"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
              >
                contact me on Discord
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
