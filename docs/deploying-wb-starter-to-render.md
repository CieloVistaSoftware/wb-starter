# Deploying WB-Starter to Render

This guide covers deploying the WB-Starter Node.js server to [Render](https://render.com).

## Prerequisites

- A Render account
- The repository pushed to GitHub

## Steps

### 1. Create a New Web Service

1. Log in to [render.com](https://render.com) and click **New → Web Service**.
2. Connect your GitHub repository.
3. Select the `wb-starter` repo.

### 2. Configure the Service

| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Port** | `3000` (or set `PORT` env var) |

### 3. Environment Variables

Set the following in Render's **Environment** panel:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### 4. Deploy

Click **Create Web Service**. Render will install dependencies, start the server, and provide a public URL.

## Notes

- The server serves both static assets and page fragments.
- No build step is required — source files are served directly.
- Check [Render's current pricing](https://render.com/pricing) for details on free tier limitations such as spin-down behavior on inactive services.
