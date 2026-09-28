# Contributing to ThreatX 🛡️

Thank you for your interest in contributing to ThreatX! ThreatX is a next-generation AI-powered Security Operations Center (SOC) platform.

---

## 🏗️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/threatx.git
   cd threatx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   node scripts/setup-env.js
   ```

4. **Seed baseline data:**
   ```bash
   npm run seed
   ```

5. **Start development services:**
   ```bash
   npm run demo
   ```

---

## 🧪 Testing & Verification Guidelines

Before submitting pull requests:
- Run all automated tests: `npm run test`
- Verify production builds: `npm run build`
- Ensure no secrets or API keys are committed.
- Keep changes scoped and follow established architectural patterns.

---

## 🔒 Security Vulnerability Reporting

Please report any sensitive security vulnerabilities privately to `security@threatx.io` rather than opening public GitHub issues.
