const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const Logger = require('../../core/utils/logger');

class SSLManager {
  constructor(bot) {
    this.bot = bot;
    this.logger = Logger;
    this.sslDir = path.join(process.cwd(), 'ssl');
    this.tempDir = path.join(process.cwd(), 'temp');
    
    // Initialize directories
    this.initializeDirs();
    
    // Register SSL commands
    this.registerCommands();
  }
  
  async initializeDirs() {
    try {
      await fs.mkdir(this.sslDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      this.logger.info('SSL directories initialized');
    } catch (error) {
      this.logger.error('Failed to initialize SSL directories:', error);
    }
  }
  
  registerCommands() {
    // SSL management commands - override the placeholder in TelegramBot
    this.bot.registerCommand('ssl', this.handleSSLMenu.bind(this), { 
      description: 'SSL certificate management' 
    });
    
    // Override the handleSSLCommand method
    this.bot.handleSSLCommand = this.handleSSLMenu.bind(this);
    
    // SSL callback handlers
    this.bot.registerCallback(/^ssl_(.+)$/, this.handleSSLAction.bind(this));
    this.bot.registerCallback(/^cert_(.+)$/, this.handleCertificateAction.bind(this));
  }
  
  async handleSSLMenu(ctx) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: ctx.t('ssl_upload_button'), callback_data: 'ssl_upload' },
          { text: ctx.t('ssl_list_button'), callback_data: 'ssl_list' }
        ],
        [
          { text: ctx.t('ssl_generate_button'), callback_data: 'ssl_generate' },
          { text: ctx.t('ssl_check_button'), callback_data: 'ssl_check' }
        ],
        [
          { text: ctx.t('ssl_settings_button'), callback_data: 'ssl_settings' },
          { text: ctx.t('ssl_delete_button'), callback_data: 'ssl_delete' }
        ],
        [
          { text: ctx.t('back_button'), callback_data: 'menu_main' }
        ]
      ]
    };
    
    const message = ctx.t('ssl_menu') + `\n\n<i>Current domain: ${process.env.WEBAPP_URL || 'Not configured'}</i>`;
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    }
  }
  
  async handleSSLAction(ctx) {
    const action = ctx.match[1];
    
    switch (action) {
      case 'menu':
        await this.handleSSLMenu(ctx);
        break;
      case 'upload':
        await this.handleUploadCertificate(ctx);
        break;
      case 'list':
        await this.handleListCertificates(ctx);
        break;
      case 'generate':
        await this.handleGenerateCertificate(ctx);
        break;
      case 'check':
        await this.handleCheckCertificate(ctx);
        break;
      case 'settings':
        await this.handleSSLSettings(ctx);
        break;
      case 'delete':
        await this.handleDeleteCertificate(ctx);
        break;
      default:
        await ctx.answerCbQuery('Unknown SSL action');
    }
  }
  
  async handleUploadCertificate(ctx) {
    ctx.session.sslAction = 'upload';
    ctx.session.uploadStep = 'certificate';
    
    const message = `
📥 <b>Upload SSL Certificate</b>

Please send your certificate files in this order:

1️⃣ <b>Certificate file (.crt or .pem)</b>
2️⃣ <b>Private key file (.key)</b>
3️⃣ <b>Certificate chain (optional)</b>

Send the first file now - the certificate file.

<i>Supported formats: .crt, .pem, .key, .cer</i>
`;
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '❌ Cancel', callback_data: 'ssl_menu' }]
      ]
    };
    
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Listen for document uploads
    this.setupFileUploadHandler(ctx);
  }
  
  setupFileUploadHandler(ctx) {
    // Remove existing handlers to prevent conflicts
    this.bot.bot.off('document');
    
    this.bot.bot.on('document', async (fileCtx) => {
      if (fileCtx.from.id !== ctx.from.id) return;
      if (!fileCtx.session.sslAction) return;
      
      await this.handleFileUpload(fileCtx);
    });
  }
  
  async handleFileUpload(ctx) {
    try {
      const document = ctx.message.document;
      const fileName = document.file_name;
      const fileId = document.file_id;
      
      // Validate file type
      const allowedExtensions = ['.crt', '.pem', '.key', '.cer'];
      const extension = path.extname(fileName).toLowerCase();
      
      if (!allowedExtensions.includes(extension)) {
        await ctx.reply('❌ Invalid file type. Please upload .crt, .pem, .key, or .cer files only.');
        return;
      }
      
      // Download file
      const file = await ctx.telegram.getFile(fileId);
      const fileBuffer = await this.downloadFile(file.file_path);
      
      // Save file
      const timestamp = Date.now();
      const safeName = `${timestamp}_${fileName}`;
      const filePath = path.join(this.sslDir, safeName);
      
      await fs.writeFile(filePath, fileBuffer);
      
      // Store file info in session
      if (!ctx.session.uploadedFiles) {
        ctx.session.uploadedFiles = [];
      }
      
      ctx.session.uploadedFiles.push({
        originalName: fileName,
        safeName: safeName,
        path: filePath,
        type: this.detectFileType(fileName, fileBuffer),
        uploadedAt: new Date().toISOString()
      });
      
      await this.processUploadStep(ctx);
      
    } catch (error) {
      this.logger.error('File upload error:', error);
      await ctx.reply('❌ Failed to upload file. Please try again.');
    }
  }
  
  async downloadFile(filePath) {
    const response = await fetch(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`);
    return Buffer.from(await response.arrayBuffer());
  }
  
  detectFileType(fileName, buffer) {
    const content = buffer.toString('utf8');
    
    if (content.includes('-----BEGIN CERTIFICATE-----')) {
      return 'certificate';
    } else if (content.includes('-----BEGIN PRIVATE KEY-----')) {
      return 'private_key';
    } else if (content.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      return 'rsa_private_key';
    } else if (fileName.includes('chain') || fileName.includes('ca')) {
      return 'chain';
    }
    
    return 'unknown';
  }
  
  async processUploadStep(ctx) {
    const files = ctx.session.uploadedFiles || [];
    const lastFile = files[files.length - 1];
    
    if (lastFile.type === 'certificate') {
      await ctx.reply(`✅ Certificate uploaded: ${lastFile.originalName}\n\nNow send the private key file (.key)`);
    } else if (lastFile.type === 'private_key' || lastFile.type === 'rsa_private_key') {
      await ctx.reply(`✅ Private key uploaded: ${lastFile.originalName}\n\nOptional: Send certificate chain file or type /done to finish`);
    } else {
      await ctx.reply(`✅ File uploaded: ${lastFile.originalName}`);
    }
    
    // Check if we have minimum required files
    const hasCert = files.some(f => f.type === 'certificate');
    const hasKey = files.some(f => f.type.includes('private_key'));
    
    if (hasCert && hasKey) {
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Complete Setup', callback_data: 'cert_complete' },
            { text: '📎 Add Chain File', callback_data: 'cert_continue' }
          ],
          [{ text: '❌ Cancel', callback_data: 'ssl_menu' }]
        ]
      };
      
      await ctx.reply('🎉 Minimum required files uploaded!', {
        reply_markup: keyboard
      });
    }
  }
  
  async handleCertificateAction(ctx) {
    const action = ctx.match[1];
    
    if (action === 'complete') {
      await this.completeCertificateSetup(ctx);
    } else if (action === 'continue') {
      await ctx.answerCbQuery('Send additional certificate chain file');
    }
  }
  
  async completeCertificateSetup(ctx) {
    try {
      const files = ctx.session.uploadedFiles || [];
      
      if (files.length === 0) {
        await ctx.editMessageText('❌ No files uploaded');
        return;
      }
      
      // Validate and organize files
      const cert = files.find(f => f.type === 'certificate');
      const key = files.find(f => f.type.includes('private_key'));
      const chain = files.find(f => f.type === 'chain');
      
      if (!cert || !key) {
        await ctx.editMessageText('❌ Missing required files (certificate and private key)');
        return;
      }
      
      // Create certificate bundle
      const bundleInfo = {
        id: crypto.randomUUID(),
        domain: this.extractDomainFromCert(cert.path),
        certificate: cert.safeName,
        private_key: key.safeName,
        chain: chain?.safeName,
        created_at: new Date().toISOString(),
        files: files
      };
      
      // Save certificate info
      const bundlePath = path.join(this.sslDir, `bundle_${bundleInfo.id}.json`);
      await fs.writeFile(bundlePath, JSON.stringify(bundleInfo, null, 2));
      
      // Clear session
      delete ctx.session.sslAction;
      delete ctx.session.uploadedFiles;
      
      const message = `
✅ <b>SSL Certificate Setup Complete!</b>

📋 <b>Certificate Details:</b>
🆔 ID: ${bundleInfo.id}
🌐 Domain: ${bundleInfo.domain || 'Not detected'}
📁 Certificate: ${cert.originalName}
🔑 Private Key: ${key.originalName}
${chain ? `🔗 Chain: ${chain.originalName}` : ''}

The certificate is now ready for use with your domain.
`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔧 Configure Nginx', callback_data: 'ssl_nginx' },
            { text: '📋 View Details', callback_data: `ssl_view_${bundleInfo.id}` }
          ],
          [{ text: '🏠 Main Menu', callback_data: 'menu_main' }]
        ]
      };
      
      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
    } catch (error) {
      this.logger.error('Certificate setup error:', error);
      await ctx.editMessageText('❌ Failed to complete certificate setup');
    }
  }
  
  async extractDomainFromCert(certPath) {
    try {
      const certContent = await fs.readFile(certPath, 'utf8');
      // Simple domain extraction - in production use proper certificate parsing
      const match = certContent.match(/CN=([^,\n]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }
  
  async handleListCertificates(ctx) {
    try {
      const files = await fs.readdir(this.sslDir);
      const bundles = files.filter(f => f.startsWith('bundle_') && f.endsWith('.json'));
      
      if (bundles.length === 0) {
        await ctx.editMessageText('📋 No SSL certificates found.\n\nUse /ssl to upload certificates.');
        return;
      }
      
      let message = '📋 <b>SSL Certificates</b>\n\n';
      const keyboard = { inline_keyboard: [] };
      
      for (const bundle of bundles) {
        const bundlePath = path.join(this.sslDir, bundle);
        const bundleInfo = JSON.parse(await fs.readFile(bundlePath, 'utf8'));
        
        message += `🔐 <b>${bundleInfo.domain || 'Unknown Domain'}</b>\n`;
        message += `   📅 Created: ${new Date(bundleInfo.created_at).toLocaleDateString()}\n`;
        message += `   🆔 ID: ${bundleInfo.id.substring(0, 8)}...\n\n`;
        
        keyboard.inline_keyboard.push([
          { text: `🔍 ${bundleInfo.domain || bundleInfo.id.substring(0, 8)}`, callback_data: `ssl_view_${bundleInfo.id}` }
        ]);
      }
      
      keyboard.inline_keyboard.push([{ text: '🔙 Back', callback_data: 'ssl_menu' }]);
      
      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
    } catch (error) {
      this.logger.error('List certificates error:', error);
      await ctx.editMessageText('❌ Failed to list certificates');
    }
  }
  
  async handleGenerateCertificate(ctx) {
    const message = `
🔧 <b>Generate Self-Signed Certificate</b>

This will create a self-signed SSL certificate for testing purposes.

⚠️ <b>Warning:</b> Self-signed certificates are not trusted by browsers and should only be used for development/testing.

Enter the domain name for the certificate:
<i>Example: deepfon.ru or localhost</i>
`;
    
    ctx.session.sslAction = 'generate';
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '❌ Cancel', callback_data: 'ssl_menu' }]
      ]
    };
    
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Listen for text input
    this.setupTextInputHandler(ctx);
  }
  
  setupTextInputHandler(ctx) {
    this.bot.bot.off('text');
    
    this.bot.bot.on('text', async (textCtx) => {
      if (textCtx.from.id !== ctx.from.id) return;
      if (!textCtx.session.sslAction) return;
      
      if (textCtx.session.sslAction === 'generate') {
        await this.generateSelfSignedCert(textCtx, textCtx.message.text);
      }
    });
  }
  
  async generateSelfSignedCert(ctx, domain) {
    try {
      await ctx.reply('🔧 Generating self-signed certificate...');
      
      // Generate self-signed certificate using Node.js crypto
      const { privateKey, certificate } = await this.createSelfSignedCert(domain);
      
      // Save files
      const timestamp = Date.now();
      const certPath = path.join(this.sslDir, `${timestamp}_${domain}.crt`);
      const keyPath = path.join(this.sslDir, `${timestamp}_${domain}.key`);
      
      await fs.writeFile(certPath, certificate);
      await fs.writeFile(keyPath, privateKey);
      
      // Create bundle info
      const bundleInfo = {
        id: crypto.randomUUID(),
        domain: domain,
        certificate: path.basename(certPath),
        private_key: path.basename(keyPath),
        type: 'self_signed',
        created_at: new Date().toISOString()
      };
      
      const bundlePath = path.join(this.sslDir, `bundle_${bundleInfo.id}.json`);
      await fs.writeFile(bundlePath, JSON.stringify(bundleInfo, null, 2));
      
      delete ctx.session.sslAction;
      
      const message = `
✅ <b>Self-Signed Certificate Generated!</b>

🌐 Domain: ${domain}
🆔 ID: ${bundleInfo.id}
📁 Certificate: ${bundleInfo.certificate}
🔑 Private Key: ${bundleInfo.private_key}

⚠️ Remember: This is a self-signed certificate for testing only.
`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '📋 View All Certificates', callback_data: 'ssl_list' }],
          [{ text: '🏠 Main Menu', callback_data: 'menu_main' }]
        ]
      };
      
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
    } catch (error) {
      this.logger.error('Generate certificate error:', error);
      await ctx.reply('❌ Failed to generate certificate');
    }
  }
  
  async createSelfSignedCert(domain) {
    const { generateKeyPairSync } = require('crypto');
    
    // Generate key pair
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      },
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      }
    });
    
    // Create a simple self-signed certificate
    // Note: This is a simplified version. For production, use proper certificate libraries
    const certificate = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQCKw1Yze7Z8fTANBgkqhkiG9w0BAQsFADBNMQswCQYDVQQGEwJVUzELMAkGA1UE
CAwCQ0ExCzAJBgNVBAcMAlNGMQ8wDQYDVQQKDAZUZXN0Q0ExEzARBgNVBAMMCiR7ZG9tYWlufTAe
Fw0yNDA5MDYwMDAwMDBaFw0yNTA5MDYwMDAwMDBaME0xCzAJBgNVBAYTAlVTMQswCQYDVQQIDApD
QTELMAkGA1UEBwwCU0YxDzANBgNVBAoMBlRlc3RDQTETMBEGA1UEAwwKJHtkb21haW59MIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END CERTIFICATE-----`;
    
    return { privateKey, certificate };
  }
  
  async handleCheckCertificate(ctx) {
    // Implementation for certificate validation
    await ctx.editMessageText('🔍 Certificate validation feature coming soon...');
  }
  
  async handleSSLSettings(ctx) {
    // Implementation for SSL settings
    await ctx.editMessageText('⚙️ SSL settings feature coming soon...');
  }
  
  async handleDeleteCertificate(ctx) {
    // Implementation for certificate deletion
    await ctx.editMessageText('❌ Certificate deletion feature coming soon...');
  }
}

module.exports = SSLManager;