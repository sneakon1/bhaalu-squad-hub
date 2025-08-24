import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const FootballThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative p-2 hover:bg-muted"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
        {/* Football icon that rotates on theme change */}
        <div 
          className={`absolute inset-0 transition-transform duration-500 ${
            theme === 'dark' ? 'rotate-180' : 'rotate-0'
          }`}
        >
          {/* Football SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            {/* Football shape */}
            <ellipse cx="12" cy="12" rx="6" ry="8" />
            {/* Football lines */}
            <path d="M12 4v16" />
            <path d="M8 7l8 0" />
            <path d="M8 17l8 0" />
            <path d="M6 10l12 0" />
            <path d="M6 14l12 0" />
          </svg>
        </div>
        
        {/* Light/Dark indicator */}
        <div 
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-blue-400 shadow-sm shadow-blue-400/50' 
              : 'bg-yellow-400 shadow-sm shadow-yellow-400/50'
          }`}
        />
      </div>
    </Button>
  );
};

export default FootballThemeToggle;