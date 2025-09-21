import './index.css';
import { Routes, Route } from 'react-router';
import { ReactFlowProvider } from '@xyflow/react';
import { AuthProvider } from './contexts/auth-context';
import { AuthGuard } from './components/auth/auth-guard';
import { FlowEditor } from './components/editor/flow-editor';
import { FlowPlayerPage } from './pages/flow-player-page';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './lib/use-theme';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="h-screen w-full bg-background text-foreground">
          <Routes>
            <Route
              path="/"
              element={
                <AuthGuard>
                  <ReactFlowProvider>
                    <FlowEditor />
                  </ReactFlowProvider>
                </AuthGuard>
              }
            />
            <Route path="/play/:id" element={<FlowPlayerPage />} />
            <Route path="/play" element={<FlowPlayerPage />} />
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
