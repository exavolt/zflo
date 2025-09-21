import { Routes, Route } from 'react-router';
import { HomePage } from './pages/home-page';
import { DocsPage } from './pages/docs-page';
import { UseCasesPage } from './pages/use-cases-page';
import { Navigation } from './components/navigation';
import { Footer } from './components/footer';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/use-cases" element={<UseCasesPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
