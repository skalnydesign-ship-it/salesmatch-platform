import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedText.css';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'typewriter';
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.5,
  stagger = 0.05,
  variant = 'fadeIn'
}) => {
  const words = text.split(' ');

  const variants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slideUp: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0 }
    },
    slideDown: {
      hidden: { opacity: 0, y: -50 },
      visible: { opacity: 1, y: 0 }
    },
    slideLeft: {
      hidden: { opacity: 0, x: 50 },
      visible: { opacity: 1, x: 0 }
    },
    slideRight: {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0 }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1 }
    },
    typewriter: {
      hidden: { width: 0 },
      visible: { width: 'auto' }
    }
  };

  if (variant === 'typewriter') {
    return (
      <motion.div
        className={`animated-text animated-text--typewriter ${className}`}
        initial="hidden"
        animate="visible"
        variants={variants[variant]}
        transition={{ duration, delay }}
      >
        {text}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`animated-text ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger
          }
        }
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="animated-text__word"
          variants={variants[variant]}
          transition={{ duration, delay: delay + index * stagger }}
        >
          {word}{' '}
        </motion.span>
      ))}
    </motion.div>
  );
};
