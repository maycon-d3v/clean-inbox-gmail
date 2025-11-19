# Gmail Cleanup App

A web application to help clean up your Gmail inbox by analyzing and deleting emails in bulk based on various criteria.

## Features

- **Google OAuth Authentication**: Secure login with your Google account
- **Email Statistics**: View counts of unread, spam, trash, and old emails
- **Smart Grouping**: Emails grouped by sender within categories (Unread, Spam, Trash, Old)
- **Preview Before Delete**: Review and select specific email groups before deletion
- **Category Filtering**: Visual color-coding for easy identification
- **Real-time Search**: Filter emails by sender with term highlighting
- **Batch Processing**: Efficiently handles large volumes of emails with rate limiting
- **Session Management**: Secure 2-hour sessions with automatic cleanup
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- ASP.NET Core 8.0
- Google Gmail API
- OAuth 2.0 authentication
- Docker support

### Frontend
- React 18
- Vite
- React Router
- Axios
- BoxIcons

## Project Structure

```
clean-inbox-gmail/
├── backend/
│   └── GmailCleanup.API/
│       ├── Controllers/
│       ├── DTOs/
│       ├── Services/
│       ├── Dockerfile
│       └── appsettings.json
├── frontend/
│   └── gmail-cleanup-app/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   └── App.jsx
│       └── package.json
└── DEPLOY.md
```

## Local Development

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+
- Google Cloud Console project with Gmail API enabled

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend/GmailCleanup.API
```

2. Configure Google OAuth credentials in `appsettings.json`:
```json
{
  "Google": {
    "ClientId": "YOUR_CLIENT_ID",
    "ClientSecret": "YOUR_CLIENT_SECRET",
    "RedirectUri": "http://localhost:5000/api/auth/callback"
  }
}
```

3. Run the backend:
```bash
dotnet run
```

Backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend/gmail-cleanup-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```
VITE_API_URL=http://localhost:5000/api
```

4. Run the frontend:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions to Render.com.

### Quick Deploy Steps

1. **Backend (Render.com)**:
   - Create Web Service from Docker
   - Set environment variables (Google OAuth, CORS)
   - Deploy from GitHub

2. **Frontend (Render.com or Netlify)**:
   - Create Static Site
   - Set `VITE_API_URL` environment variable
   - Deploy from GitHub

## Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: Your frontend URLs
   - Authorized redirect URIs: Your backend callback URLs

### Environment Variables

#### Backend
- `Google__ClientId`: Google OAuth Client ID
- `Google__ClientSecret`: Google OAuth Client Secret
- `Google__RedirectUri`: OAuth callback URL
- `AllowedOrigins__0`: Frontend URL for CORS
- `ASPNETCORE_ENVIRONMENT`: Environment (Development/Production)

#### Frontend
- `VITE_API_URL`: Backend API base URL

## Usage

1. Click "Login with Google"
2. Authorize the application to access your Gmail
3. View email statistics on the dashboard
4. Click on a category to preview emails
5. Use search to filter by sender
6. Select/deselect email groups
7. Click "Delete X Emails" to confirm deletion

## Rate Limiting

The app implements intelligent rate limiting to avoid Gmail API quota issues:
- Batch size: 50 emails per request
- Delay between batches: 500ms
- Exponential backoff on 429 errors
- Maximum retries: 3 attempts

## Security

- OAuth 2.0 authentication
- Session-based token management (2-hour expiration)
- CORS protection
- No email content stored on server
- All operations performed via Gmail API


## License

MIT

## Author

Developed with focus on clean code and user experience.
