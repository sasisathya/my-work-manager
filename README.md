# Work Manager Dashboard

A comprehensive work management dashboard integrating Jira, GitHub, Docker, and Kubernetes with AI-powered features.

## Features

- **Jira Integration**: Manage issues with AI-powered text enhancement
- **GitHub PR Review**: AI-assisted code review and bulk comment submission
- **Docker/Kafka Management**: One-click Docker service management for Kafka UI, Grafana, and Prometheus
- **Kubernetes Terminal**: Interactive K8s pod management and log search
- **File Viewer**: View PDF, Excel, Word files and edit Markdown/HTML
- **Task Management**: Create sticky notes for task tracking

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Credentials

Copy the example configuration file:

```bash
cp config.json.example config.json
```

Edit `config.json` and fill in your credentials:

- **Jira**: Add your Jira URL, email, and API token
- **GitHub**: Add your GitHub personal access token and repository
- **AI/LLM**: Add your Claude API key and LiteLLM proxy URL (if using)
- **Confluence** (optional): Add Confluence credentials
- **Kafka** (optional): Add Confluent Cloud credentials for Docker Kafka services

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:2999](http://localhost:2999)

## Security Notes

- `config.json` contains sensitive credentials and is **gitignored**
- Never commit `config.json` to version control
- All task data and attachments are stored in `/data` directory (gitignored)
- Use `config.json.example` as a template for new setups

## Docker Services

The Docker/Kafka page provides one-click management for:

- **Kafka UI** (Port 8090): Web interface for Confluent Cloud Kafka
- **Grafana** (Port 3080): Monitoring dashboards (login: admin/admin)
- **Prometheus** (Port 9090): Metrics collection

Configure Kafka credentials in `config.json` before starting services.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React, TailwindCSS, Lucide Icons
- **APIs**: Jira REST API, GitHub REST API, Docker CLI
- **AI**: Anthropic Claude (via LiteLLM proxy)

## License

MIT
