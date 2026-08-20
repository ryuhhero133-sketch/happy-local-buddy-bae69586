import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';

export interface WindowState {
  id: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  title: string;
}

interface GameWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  zIndex: number;
  onFocus: () => void;
  initialPosition?: { x: number; y: number };
  width?: number | string;
  height?: number | string;
}

export const GameWindow: React.FC<GameWindowProps> = ({
  id,
  title,
  icon,
  children,
  onClose,
  onMinimize,
  isMinimized,
  zIndex,
  onFocus,
  initialPosition = { x: 100, y: 100 },
  width = 400,
  height = 'auto',
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`window_pos_${id}`);
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch (e) {}
    }
  }, [id]);

  const handleDragEnd = (_: any, info: any) => {
    const newPos = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y
    };
    // Boundary check to keep window in viewport
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 50;
    const clampedPos = {
      x: Math.max(0, Math.min(newPos.x, maxX)),
      y: Math.max(0, Math.min(newPos.y, maxY))
    };
    
    setPosition(clampedPos);
    localStorage.setItem(`window_pos_${id}`, JSON.stringify(clampedPos));
    setIsDragging(false);
  };

  return (
    <motion.div
      drag={!isMinimized}
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        onFocus();
      }}
      onDragEnd={handleDragEnd}
      initial={initialPosition}
      animate={{ 
        x: position.x, 
        y: position.y,
        scale: 1,
        opacity: 1
      }}
      style={{
        position: 'fixed',
        zIndex,
        width: isMinimized ? 200 : width,
        height: isMinimized ? 'auto' : height,
        pointerEvents: 'auto',
      }}
      className="flex flex-col rounded-lg border-2 border-[#4A3728] bg-[#2D1B0E] shadow-[0_8px_0_0_#1A0F08,0_12px_24px_rgba(0,0,0,0.5)] overflow-hidden font-pixel"
    >
      {/* Header - The whole header is the drag handle by default for framer-motion drag={true} */}
      <div 
        className="window-header flex items-center justify-between px-3 py-2 bg-[#4A3728] cursor-move select-none border-b-2 border-[#1A0F08]"
        onMouseDown={onFocus}
      >
        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <span className="text-[#F3E5AB] text-sm truncate uppercase tracking-wider drop-shadow-md">
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="p-1 hover:bg-[#5C4533] rounded transition-colors text-[#F3E5AB]"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
          </button>
          <button 
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 hover:bg-red-900 rounded transition-colors text-[#F3E5AB]"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 p-4 bg-[#3E2A1C] text-[#F3E5AB] overflow-auto custom-scrollbar"
            style={{ maxHeight: '70vh' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
