// Test Context7 MCP Integration
const { spawn } = require('child_process');

console.log('🧪 Testing Context7 MCP Integration...\n');

// Test 1: Check if Context7 MCP server is running
console.log('1️⃣ Checking Context7 MCP server status...');
const context7Process = spawn('ps', ['aux']);
let context7Running = false;

context7Process.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('context7-mcp')) {
    context7Running = true;
    console.log('✅ Context7 MCP server is running');
  }
});

context7Process.on('close', () => {
  if (!context7Running) {
    console.log('❌ Context7 MCP server is not running');
  }
});

// Test 2: Check backend server
console.log('\n2️⃣ Checking backend server...');
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log('✅ Backend server is healthy');
      console.log(`   Status: ${health.status}`);
      console.log(`   Version: ${health.version}`);
      console.log(`   Environment: ${health.environment}`);
    } catch (error) {
      console.log('❌ Backend server health check failed');
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Backend server is not responding');
});

req.end();

// Test 3: Check frontend server
console.log('\n3️⃣ Checking frontend server...');
const frontendOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET'
};

const frontendReq = http.request(frontendOptions, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Frontend server is running');
    console.log(`   Status: ${res.statusCode}`);
  } else {
    console.log(`❌ Frontend server returned status: ${res.statusCode}`);
  }
});

frontendReq.on('error', (error) => {
  console.log('❌ Frontend server is not responding');
});

frontendReq.end();

// Test 4: Check Context7 configuration
console.log('\n4️⃣ Checking Context7 configuration...');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'context7.config.js');
if (fs.existsSync(configPath)) {
  console.log('✅ Context7 configuration file exists');
  const config = require(configPath);
  console.log(`   Server: ${config.mcp.server}`);
  console.log(`   Command: ${config.mcp.command}`);
  console.log(`   Features: ${Object.keys(config.features).join(', ')}`);
} else {
  console.log('❌ Context7 configuration file not found');
}

// Test 5: Check Context7Provider
console.log('\n5️⃣ Checking Context7Provider...');
const providerPath = path.join(__dirname, 'miniapp/frontend/src/contexts/Context7Provider.tsx');
if (fs.existsSync(providerPath)) {
  console.log('✅ Context7Provider exists');
  const content = fs.readFileSync(providerPath, 'utf8');
  const hasContext7Provider = content.includes('Context7Provider');
  const hasContext7Context = content.includes('Context7Context');
  const hasUseContext7 = content.includes('useContext7');
  
  console.log(`   Context7Provider: ${hasContext7Provider ? '✅' : '❌'}`);
  console.log(`   Context7Context: ${hasContext7Context ? '✅' : '❌'}`);
  console.log(`   useContext7 hook: ${hasUseContext7 ? '✅' : '❌'}`);
} else {
  console.log('❌ Context7Provider not found');
}

// Test 6: Check updated pages
console.log('\n6️⃣ Checking updated pages...');
const pagesDir = path.join(__dirname, 'miniapp/frontend/src/pages');
const pages = ['AuthPage.tsx', 'ProfilePage.tsx', 'MatchesPage.tsx', 'MatchingPage.tsx', 'MessagesPage.tsx'];

let updatedPages = 0;
pages.forEach(page => {
  const pagePath = path.join(pagesDir, page);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    if (content.includes('useContext7') || content.includes('Context7')) {
      console.log(`   ✅ ${page} - Context7 integrated`);
      updatedPages++;
    } else {
      console.log(`   ❌ ${page} - Context7 not integrated`);
    }
  } else {
    console.log(`   ❌ ${page} - File not found`);
  }
});

console.log(`\n📊 Summary: ${updatedPages}/${pages.length} pages updated with Context7`);

// Test 7: Check package.json scripts
console.log('\n7️⃣ Checking package.json scripts...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts;
  
  if (scripts['context7']) {
    console.log('✅ Context7 script exists');
  } else {
    console.log('❌ Context7 script not found');
  }
  
  if (scripts['dev:with-context7']) {
    console.log('✅ dev:with-context7 script exists');
  } else {
    console.log('❌ dev:with-context7 script not found');
  }
} else {
  console.log('❌ package.json not found');
}

console.log('\n🎉 Context7 integration test completed!');
console.log('\n📝 Next steps:');
console.log('   1. Open http://localhost:3001 in your browser');
console.log('   2. Check for Context7 indicators in the UI');
console.log('   3. Look for code suggestions and best practices');
console.log('   4. Test security checks and performance tips');
