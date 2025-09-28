# 🔒 Security Guidelines

## API Keys and Secrets Protection

This project contains sensitive configuration that must be protected. Follow these guidelines to keep your API keys secure.

### 🚨 CRITICAL: Never commit real API keys to Git!

### Required Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values in `.env`:**
   - `BOT_TOKEN` - Your Telegram bot token from @BotFather
   - `DEEPSEEK_API_KEY` - Your DeepSeek API key
   - `JWT_SECRET` - A long, random secret for JWT tokens
   - `DB_PASSWORD` - Your database password
   - `SSH_PASSWORD` - SSH password for deployment scripts

### 🔐 Security Best Practices

1. **Environment Variables:**
   - Always use `.env` files for local development
   - Never commit `.env` files to version control
   - Use different keys for development, staging, and production

2. **SSH Scripts:**
   - SSH scripts now use `$env(SSH_PASSWORD)` instead of hardcoded passwords
   - Set your SSH password as an environment variable:
     ```bash
     export SSH_PASSWORD="your_actual_password"
     ```

3. **API Key Rotation:**
   - Regularly rotate your API keys
   - Monitor API usage for suspicious activity
   - Revoke compromised keys immediately

4. **Production Deployment:**
   - Use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)
   - Never store secrets in code or configuration files
   - Use environment variables or secure vaults

### 🛡️ Files Protected by .gitignore

The following file patterns are automatically ignored:
- `.env*` - All environment files
- `*secret*` - Files containing "secret"
- `*password*` - Files containing "password"
- `*token*` - Files containing "token"
- `*api_key*` - Files containing "api_key"
- `*.key` - All key files
- `*.pem` - SSH private keys
- `id_rsa*` - SSH key files

### 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate the compromised keys**
2. **Remove from Git history:**
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push to remote:**
   ```bash
   git push origin --force --all
   ```

### 📞 Support

If you discover a security vulnerability, please report it privately to the maintainers.

---

**Remember: Security is everyone's responsibility!** 🛡️
