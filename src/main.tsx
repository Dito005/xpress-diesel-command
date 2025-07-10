import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = createRoot(document.getElementById("root")!);

// Show loading indicator immediately
root.render(
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium">Loading Command Center...</p>
    </div>
  </div>
);

// Load the app after a small delay to allow hydration
setTimeout(() => {
  root.render(<App />);
}, 100);