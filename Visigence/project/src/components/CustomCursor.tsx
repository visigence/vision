import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link2, Type, Play, ExternalLink, Plus, Minus, Copy } from 'lucide-react';

type CursorType = 'default' | 'link' | 'text' | 'button' | 'slider' | 'copy';

const CustomCursor: React.FC = () => {
  const [cursorType, setCursorType] = useState<CursorType>('default');
  const [isHovering, setIsHovering] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Smoother animation with lower stiffness and higher damping
  const springConfig = { damping: 35, stiffness: 350 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const scale = useTransform(
    useMotionValue(isHovering ? 1 : 0),
    [0, 1],
    [1, cursorType === 'text' ? 0.5 : 1.2]
  );

  const getCursorIcon = () => {
    switch (cursorType) {
      case 'link':
        return <Link2 className="w-3 h-3 text-white/90" />;
      case 'text':
        return <Type className="w-3 h-3 text-white/90" />;
      case 'button':
        return <Play className="w-3 h-3 text-white/90" />;
      case 'slider':
        return isHovering ? <Plus className="w-3 h-3 text-white/90" /> : <Minus className="w-3 h-3 text-white/90" />;
      case 'copy':
        return <Copy className="w-3 h-3 text-white/90" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      const timestamp = Date.now();
      requestAnimationFrame(() => {
        if (Date.now() - timestamp < 100) { // Throttle updates
          cursorX.set(e.clientX);
          cursorY.set(e.clientY);
        }
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(true);

      if (target.matches('a, [role="link"]')) {
        setCursorType('link');
      } else if (target.matches('input[type="text"], textarea, [contenteditable="true"]')) {
        setCursorType('text');
      } else if (target.matches('button, [role="button"]')) {
        setCursorType('button');
      } else if (target.matches('input[type="range"]')) {
        setCursorType('slider');
      } else if (target.matches('[data-copyable]')) {
        setCursorType('copy');
      } else if (window.getComputedStyle(target).cursor === 'pointer') {
        setCursorType('button');
      } else {
        setCursorType('default');
        setIsHovering(false);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
      setCursorType('default');
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      <motion.div
        className={`cursor-main ${isHovering ? 'has-content' : ''}`}
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
          scale,
        }}
      >
        {isHovering && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="icon-container"
          >
            {getCursorIcon()}
          </motion.div>
        )}
      </motion.div>
      
      <motion.div
        className="cursor-trail"
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
          scale: useTransform(scale, [1, 1.2], [0.8, 1]),
          opacity: useTransform(scale, [1, 1.2], [0.15, 0.1]),
        }}
      />
    </>
  );
};

export default CustomCursor;