import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Context7 MCP Integration
interface Context7Config {
  server: string;
  command: string;
  args: string[];
  features: {
    realTimeDocs: boolean;
    codeSuggestions: boolean;
    bestPractices: boolean;
    securityChecks: boolean;
  };
}

interface Context7ContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  getDocumentation: (topic: string) => Promise<string>;
  getCodeSuggestions: (context: string) => Promise<string[]>;
  getBestPractices: (framework: string) => Promise<string[]>;
  checkSecurity: (code: string) => Promise<{ issues: string[]; suggestions: string[] }>;
}

const Context7Context = createContext<Context7ContextType | undefined>(undefined);

export const useContext7 = () => {
  const context = useContext(Context7Context);
  if (!context) {
    throw new Error('useContext7 must be used within a Context7Provider');
  }
  return context;
};

interface Context7ProviderProps {
  children: ReactNode;
}

export const Context7Provider: React.FC<Context7ProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config: Context7Config = {
    server: '@upstash/context7-mcp',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
    features: {
      realTimeDocs: true,
      codeSuggestions: true,
      bestPractices: true,
      securityChecks: true,
    },
  };

  useEffect(() => {
    initializeContext7();
  }, []);

  const initializeContext7 = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate Context7 MCP connection
      // In a real implementation, this would connect to the MCP server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Context7');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentation = async (topic: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Context7 not connected');
    }

    // Simulate documentation retrieval
    // In a real implementation, this would query the MCP server
    const mockDocs: Record<string, string> = {
      'react': 'React is a JavaScript library for building user interfaces...',
      'typescript': 'TypeScript is a typed superset of JavaScript...',
      'vite': 'Vite is a build tool that provides fast development...',
      'telegram': 'Telegram WebApp API allows creating mini-apps...',
    };

    return mockDocs[topic.toLowerCase()] || `Documentation for ${topic} not found`;
  };

  const getCodeSuggestions = async (context: string): Promise<string[]> => {
    if (!isConnected) {
      throw new Error('Context7 not connected');
    }

    // Simulate code suggestions based on context
    const suggestions: string[] = [];
    
    if (context.includes('useState')) {
      suggestions.push('Consider using useReducer for complex state logic');
      suggestions.push('Use useMemo for expensive calculations');
    }
    
    if (context.includes('useEffect')) {
      suggestions.push('Add cleanup function to prevent memory leaks');
      suggestions.push('Consider using useCallback for stable references');
    }
    
    if (context.includes('api')) {
      suggestions.push('Add error handling for API calls');
      suggestions.push('Consider using React Query for data fetching');
    }

    return suggestions;
  };

  const getBestPractices = async (framework: string): Promise<string[]> => {
    if (!isConnected) {
      throw new Error('Context7 not connected');
    }

    const practices: Record<string, string[]> = {
      'react': [
        'Use functional components with hooks',
        'Keep components small and focused',
        'Use TypeScript for type safety',
        'Implement proper error boundaries',
        'Use React.memo for performance optimization',
      ],
      'typescript': [
        'Define strict interfaces for all data structures',
        'Use enums for fixed sets of values',
        'Avoid any type, use unknown instead',
        'Use generic types for reusable components',
        'Enable strict mode in tsconfig.json',
      ],
      'vite': [
        'Use environment variables for configuration',
        'Optimize bundle size with code splitting',
        'Use CSS modules for scoped styling',
        'Configure proper build targets',
        'Use Vite plugins for additional functionality',
      ],
    };

    return practices[framework.toLowerCase()] || [];
  };

  const checkSecurity = async (code: string): Promise<{ issues: string[]; suggestions: string[] }> => {
    if (!isConnected) {
      throw new Error('Context7 not connected');
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Basic security checks
    if (code.includes('eval(')) {
      issues.push('Use of eval() detected - potential security risk');
      suggestions.push('Use JSON.parse() or alternative parsing methods');
    }

    if (code.includes('innerHTML')) {
      issues.push('Direct innerHTML usage detected');
      suggestions.push('Use textContent or React\'s dangerouslySetInnerHTML with sanitization');
    }

    if (code.includes('localStorage') && !code.includes('try-catch')) {
      issues.push('localStorage access without error handling');
      suggestions.push('Wrap localStorage calls in try-catch blocks');
    }

    return { issues, suggestions };
  };

  const value: Context7ContextType = {
    isConnected,
    isLoading,
    error,
    getDocumentation,
    getCodeSuggestions,
    getBestPractices,
    checkSecurity,
  };

  return (
    <Context7Context.Provider value={value}>
      {children}
    </Context7Context.Provider>
  );
};


