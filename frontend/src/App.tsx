import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { HomePage } from './pages/HomePage';
import { NotFound } from './pages/NotFound';
import { MergePDF } from './pages/tools/MergePDF';
import { SplitPDF } from './pages/tools/SplitPDF';
import { CompressPDF } from './pages/tools/CompressPDF';
import { RotatePDF } from './pages/tools/RotatePDF';
import { ExtractPages } from './pages/tools/ExtractPages';
import { ConvertPDF } from './pages/tools/ConvertPDF';
import { ProtectPDF } from './pages/tools/ProtectPDF';
import { UnlockPDF } from './pages/tools/UnlockPDF';
import { WatermarkPDF } from './pages/tools/WatermarkPDF';
import { EditPDF } from './pages/tools/EditPDF';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#1e293b', color: '#f8fafc' },
        }}
      />
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/merge" element={<MergePDF />} />
          <Route path="/split" element={<SplitPDF />} />
          <Route path="/compress" element={<CompressPDF />} />
          <Route path="/rotate" element={<RotatePDF />} />
          <Route path="/extract" element={<ExtractPages />} />
          <Route path="/convert" element={<ConvertPDF />} />
          <Route path="/protect" element={<ProtectPDF />} />
          <Route path="/unlock" element={<UnlockPDF />} />
          <Route path="/watermark" element={<WatermarkPDF />} />
          <Route path="/edit" element={<EditPDF />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
