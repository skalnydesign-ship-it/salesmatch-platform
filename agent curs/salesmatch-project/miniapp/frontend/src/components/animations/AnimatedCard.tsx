import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedCard.css';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  delay = 0,
  direction = 'up'
}) => {
  const directionVariants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 }
  };

  return (
    <motion.div
      className={`animated-card ${className}`}
      onClick={onClick}
      initial={directionVariants[direction]}
      animate={{ 
        x: 0, 
        y: 0, 
        opacity: 1,
        scale: 1
      }}
      whileHover={{ 
        scale: 1.02,
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: delay
      }}
      layout
    >
      {children}
    </motion.div>
  );
};

