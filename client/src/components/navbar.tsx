import { Magnet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onAboutClick: () => void;
  showGetStartedButton?: boolean;
  onGetStartedClick?: () => void;
}

export function Navbar({ onAboutClick, showGetStartedButton = false, onGetStartedClick }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-md shadow-sm border-b border-slate-200/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button 
            onClick={() => window.location.href = "/"}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Magnet className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Magnetize</h1>
          </button>
          <nav className="flex items-center space-x-6">
            <button
              onClick={onAboutClick}
              className={`${showGetStartedButton ? 'hidden sm:block' : 'block'} text-slate-600 hover:text-slate-900 transition-colors font-medium`}
            >
              About
            </button>
            {showGetStartedButton && onGetStartedClick && (
              <Button
                onClick={onGetStartedClick}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <span className="sm:hidden">Free Magnet Ideas</span>
                <span className="hidden sm:inline">Get Free Lead Magnet Ideas</span>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
} 