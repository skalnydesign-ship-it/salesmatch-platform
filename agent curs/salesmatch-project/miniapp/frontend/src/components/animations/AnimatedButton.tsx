import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedButton.css';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  return (
    <motion.button
      className={`animated-button animated-button--${variant} animated-button--${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -2,
        boxShadow: disabled ? 'none' : '0 8px 25px rgba(0,0,0,0.15)'
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95,
        y: disabled ? 0 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.span
        className="animated-button__content"
        whileHover={{ x: 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};
