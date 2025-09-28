import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { Header } from '../components/Layout/Header';
import './DemoPage.css';

export const DemoPage: React.FC = () => {
  const { showAlert, hapticFeedback } = useTelegram();
  
  // Mock Context7 functionality for demo
  const context7Connected = true;
  const getCodeSuggestions = async () => ({ suggestions: ['Mock suggestion 1', 'Mock suggestion 2'] });
  const getBestPractices = async () => ({ practices: ['Mock practice 1', 'Mock practice 2'] });
  const checkSecurity = async () => ({ issues: [], score: 95 });
  const getDocumentation = async () => ({ docs: ['Mock documentation'] });
  
  const [activeDemo, setActiveDemo] = useState<string>('');
  const [demoResults, setDemoResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const demos = [
    {
      id: 'code-suggestions',
      title: '💡 Code Suggestions',
      description: 'Get intelligent code suggestions based on context',
      icon: '💡'
    },
    {
      id: 'best-practices',
      title: '📚 Best Practices',
      description: 'Learn React and TypeScript best practices',
      icon: '📚'
    },
    {
      id: 'security-checks',
      title: '🔒 Security Checks',
      description: 'Analyze code for security vulnerabilities',
      icon: '🔒'
    },
    {
      id: 'performance-tips',
      title: '⚡ Performance Tips',
      description: 'Get performance optimization recommendations',
      icon: '⚡'
    },
    {
      id: 'documentation',
      title: '📖 Documentation',
      description: 'Access real-time documentation',
      icon: '📖'
    }
  ];

  const runDemo = async (demoId: string) => {
    if (!context7Connected) {
      showAlert('Context7 not connected. Please wait...');
      return;
    }

    setIsLoading(true);
    setActiveDemo(demoId);
    hapticFeedback('selection');

    try {
      let results: any = {};

      switch (demoId) {
        case 'code-suggestions':
          results = await getCodeSuggestions('React component with useState and useEffect hooks');
          break;
        case 'best-practices':
          results = await getBestPractices('react');
          break;
        case 'security-checks':
          results = await checkSecurity(`
            const handleSubmit = (data) => {
              localStorage.setItem('user', JSON.stringify(data));
              document.getElementById('result').innerHTML = data.message;
              eval(data.code);
            };
          `);
          break;
        case 'performance-tips':
          results = await getCodeSuggestions('React performance optimization with large lists and complex state');
          break;
        case 'documentation':
          results = await getDocumentation('react');
          break;
      }

      setDemoResults({ [demoId]: results });
      showAlert(`${demos.find(d => d.id === demoId)?.title} demo completed!`);
    } catch (error) {
      console.error('Demo error:', error);
      showAlert('Demo failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDemoResults = (demoId: string) => {
    const results = demoResults[demoId];
    if (!results) return null;

    switch (demoId) {
      case 'code-suggestions':
        return (
          <div className="demo-results">
            <h4>Code Suggestions:</h4>
            <ul>
              {Array.isArray(results) ? results.map((suggestion: string, index: number) => (
                <li key={index}>{suggestion}</li>
              )) : <li>No suggestions available</li>}
            </ul>
          </div>
        );

      case 'best-practices':
        return (
          <div className="demo-results">
            <h4>React Best Practices:</h4>
            <ul>
              {Array.isArray(results) ? results.map((practice: string, index: number) => (
                <li key={index}>{practice}</li>
              )) : <li>No practices available</li>}
            </ul>
          </div>
        );

      case 'security-checks':
        return (
          <div className="demo-results">
            <h4>Security Analysis:</h4>
            {results.issues && results.issues.length > 0 && (
              <div className="security-issues">
                <h5>⚠️ Issues Found:</h5>
                <ul>
                  {results.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {results.suggestions && results.suggestions.length > 0 && (
              <div className="security-suggestions">
                <h5>💡 Suggestions:</h5>
                <ul>
                  {results.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'performance-tips':
        return (
          <div className="demo-results">
            <h4>Performance Tips:</h4>
            <ul>
              {Array.isArray(results) ? results.map((tip: string, index: number) => (
                <li key={index}>{tip}</li>
              )) : <li>No tips available</li>}
            </ul>
          </div>
        );

      case 'documentation':
        return (
          <div className="demo-results">
            <h4>React Documentation:</h4>
            <p>{results}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="demo-page">
      <Header title="Context7 Demo" />
      
      <div className="demo-page__content">
        <div className="demo-page__header">
          <h1>🧪 Context7 MCP Demo</h1>
          <p>Experience the power of Context7 MCP integration</p>
          
          <div className="demo-page__status">
            <div className={`status-indicator ${context7Connected ? 'connected' : 'disconnected'}`}>
              {context7Connected ? '🔗 Connected' : '❌ Disconnected'}
            </div>
            <span className="status-text">
              {context7Connected ? 'Context7 MCP is active' : 'Context7 MCP is not available'}
            </span>
          </div>
        </div>

        <div className="demo-page__features">
          <h2>🚀 Available Features</h2>
          <div className="demo-grid">
            {demos.map((demo) => (
              <div 
                key={demo.id}
                className={`demo-card ${activeDemo === demo.id ? 'active' : ''}`}
                onClick={() => runDemo(demo.id)}
              >
                <div className="demo-card__icon">{demo.icon}</div>
                <h3>{demo.title}</h3>
                <p>{demo.description}</p>
                {isLoading && activeDemo === demo.id && (
                  <div className="demo-loading">
                    <div className="spinner"></div>
                    <span>Running...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {activeDemo && demoResults[activeDemo] && (
          <div className="demo-page__results">
            <h2>📊 Demo Results</h2>
            {renderDemoResults(activeDemo)}
          </div>
        )}

        <div className="demo-page__info">
          <h2>ℹ️ About Context7 MCP</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>🔧 What is Context7?</h3>
              <p>Context7 is an MCP (Model Context Protocol) server that provides real-time documentation, code suggestions, and best practices for modern web development.</p>
            </div>
            <div className="info-card">
              <h3>🎯 Features</h3>
              <ul>
                <li>Real-time documentation access</li>
                <li>Intelligent code suggestions</li>
                <li>Security vulnerability detection</li>
                <li>Performance optimization tips</li>
                <li>Best practices recommendations</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>🚀 Benefits</h3>
              <ul>
                <li>Faster development</li>
                <li>Better code quality</li>
                <li>Enhanced security</li>
                <li>Improved performance</li>
                <li>Learning opportunities</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="demo-page__footer">
          <p>Context7 MCP is integrated throughout the SalesMatch platform to enhance your development experience.</p>
          <div className="context7-badge">🔗 Context7 MCP Active</div>
        </div>
      </div>
    </div>
  );
};
