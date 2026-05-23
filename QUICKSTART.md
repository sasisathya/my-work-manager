# Quick Start Guide

## Simple 3-Step Setup

### 1. Run the Application

**Using Docker (Easiest):**
```bash
docker-compose up
```

**Or using npm:**
```bash
npm install
npm run dev
```

**Or using start script:**
```bash
./start.sh
```

### 2. Open Your Browser

Navigate to: **http://localhost:2999**

### 3. Complete the Setup Wizard

You'll see a beautiful setup page. Fill in:

#### Jira Configuration (Required)

- **Jira URL**: `https://your-company.atlassian.net`
- **Email**: Your Jira email
- **API Token**: [Get it here](https://id.atlassian.com/manage-profile/security/api-tokens)

#### AI Configuration (Optional)

- **AI Provider**: Choose OpenAI or Claude
- **API Key**:
  - [OpenAI key](https://platform.openai.com/api-keys) or
  - [Claude key](https://console.anthropic.com/settings/keys)
- Leave empty to skip AI features

Click **"Complete Setup"** and you're done!

## That's It!

You'll see your Jira tickets with:
- Click **Enhance** - AI improves your text
- Click **Format** - AI creates clean bullet points
- Click **Upload** - Add images/files
- Click **Submit** - Updates Jira and moves to "In Progress"

## Need to Change Settings?

Click the **Settings** button (top right) anytime to update your configuration.

## Troubleshooting

**Setup wizard doesn't appear?**
- Delete `config.json` and restart

**Port 2999 in use?**
- Change port in `config.json` → `"port": 3000`
- Update `docker-compose.yml` ports if using Docker

**Jira not connecting?**
- Double-check your Jira URL (must include `https://`)
- Verify your API token is fresh
- Make sure email matches your Jira account
