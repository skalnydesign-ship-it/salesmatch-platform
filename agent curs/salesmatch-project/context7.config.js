// Context7 MCP Configuration
module.exports = {
  // MCP Server Configuration
  mcp: {
    server: '@upstash/context7-mcp',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest']
  },
  
  // Project Configuration
  project: {
    name: 'salesmatch-platform',
    type: 'fullstack',
    frontend: {
      framework: 'react',
      typescript: true,
      buildTool: 'vite'
    },
    backend: {
      framework: 'express',
      language: 'javascript'
    }
  },
  
  // Documentation Sources
  docs: {
    react: 'latest',
    typescript: 'latest',
    vite: 'latest',
    express: 'latest',
    telegram: 'latest'
  },
  
  // Features to enable
  features: {
    realTimeDocs: true,
    codeSuggestions: true,
    bestPractices: true,
    securityChecks: true
  }
};

