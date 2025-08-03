import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-9 h-9 p-0"
          aria-label={`Current theme: ${theme}. Click to change theme`}
        >
          {actualTheme === 'light' ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" role="menu" aria-label="Theme selection">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center gap-2"
          role="menuitem"
          aria-selected={theme === 'light'}
        >
          <Sun className="h-4 w-4" aria-hidden="true" />
          <span>Light</span>
          {theme === 'light' && (
            <span className="ml-auto text-xs text-muted-foreground" aria-label="Currently selected">
              ✓
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2"
          role="menuitem"
          aria-selected={theme === 'dark'}
        >
          <Moon className="h-4 w-4" aria-hidden="true" />
          <span>Dark</span>
          {theme === 'dark' && (
            <span className="ml-auto text-xs text-muted-foreground" aria-label="Currently selected">
              ✓
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center gap-2"
          role="menuitem"
          aria-selected={theme === 'system'}
        >
          <Monitor className="h-4 w-4" aria-hidden="true" />
          <span>System</span>
          {theme === 'system' && (
            <span className="ml-auto text-xs text-muted-foreground" aria-label="Currently selected">
              ✓
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}