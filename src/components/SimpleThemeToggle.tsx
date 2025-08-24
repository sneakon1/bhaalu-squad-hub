import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

const SimpleThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative p-2 hover:bg-muted"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {theme === 'dark' ? (
          <Moon className="w-5 h-5 text-foreground" />
        ) : (
          <Sun className="w-5 h-5 text-foreground" />
        )}
      </div>
    </Button>
  );
};

export default SimpleThemeToggle;