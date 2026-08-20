import React, { useState, useCallback, useEffect } from 'react';
import { GameWindow, type WindowState } from './GameWindow';

interface WindowManagerProps {
  children: (props: {
    openWindow: (id: string, title: string, content?: React.ReactNode) => void;
    closeWindow: (id: string) => void;
    isWindowOpen: (id: string) => boolean;
  }) => React.ReactNode;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ children }) => {
  const [windows, setWindows] = useState<Record<string, WindowState & { content?: React.ReactNode }>>({});
  const [activeWindows, setActiveWindows] = useState<string[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);

  const openWindow = useCallback((id: string, title: string, content?: React.ReactNode) => {
    setWindows(prev => ({
      ...prev,
      [id]: {
        id,
        isOpen: true,
        isMinimized: false,
        zIndex: nextZIndex,
        position: prev[id]?.position || { x: 100 + activeWindows.length * 30, y: 100 + activeWindows.length * 30 },
        title,
        content
      }
    }));
    if (!activeWindows.includes(id)) {
      setActiveWindows(prev => [...prev, id]);
    }
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex, activeWindows]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => {
      const next = { ...prev };
      if (next[id]) next[id].isOpen = false;
      return next;
    });
    setActiveWindows(prev => prev.filter(wId => wId !== id));
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWindows(prev => {
      const next = { ...prev };
      if (next[id]) next[id].isMinimized = !next[id].isMinimized;
      return next;
    });
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      if (prev[id]?.zIndex === nextZIndex - 1) return prev;
      const next = { ...prev };
      if (next[id]) next[id].zIndex = nextZIndex;
      return next;
    });
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const isWindowOpen = useCallback((id: string) => {
    return !!windows[id]?.isOpen;
  }, [windows]);

  // Handle ESC key to close the top-most window
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeWindows.length > 0) {
        const topWindowId = activeWindows[activeWindows.length - 1];
        closeWindow(topWindowId);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeWindows, closeWindow]);

  return (
    <>
      {children({ openWindow, closeWindow, isWindowOpen })}
      
      {Object.values(windows).map(window => (
        window.isOpen && (
          <GameWindow
            key={window.id}
            id={window.id}
            title={window.title}
            isMinimized={window.isMinimized}
            zIndex={window.zIndex}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => toggleMinimize(window.id)}
            onFocus={() => focusWindow(window.id)}
            initialPosition={window.position}
          >
            {window.content || <div id={`window-content-${window.id}`} />}
          </GameWindow>
        )
      ))}
    </>
  );
};
