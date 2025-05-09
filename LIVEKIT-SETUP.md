# LiveKit Integration Setup

This document explains how to set up and use LiveKit integration in the application.

## Prerequisites

1. LiveKit Cloud account (or self-hosted LiveKit server)
2. MongoDB database

## Setup Steps

### 1. Install Dependencies

```bash
npm install
# or
yarn
```

### 2. Set Environment Variables

Make sure the following environment variables are set in your `.env.local` file:

```
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
MONGODB_URI=your-mongodb-connection-string
```

### 3. Initialize Database

Run the database initialization script to create necessary collections and sample data:

```bash
npm run db:init
# or
yarn db:init
```

### 4. Configure LiveKit Webhooks (optional)

In the LiveKit Cloud dashboard:

1. Go to your project settings
2. Navigate to the Webhooks section
3. Add a new webhook with the URL: `https://your-app-domain.com/api/livekit/webhook`
4. Select the events you want to receive (room_started, room_finished, participant_joined, participant_left, etc.)

## Features Implemented

### 1. Token Generation

- API endpoint: `/api/livekit/token` (POST)
- Generates tokens for users to join voice/video channels
- Requires user ID and channel ID

### 2. Video Chat Component

- React component: `VideoChat`
- Supports both video and voice-only channels
- Features:
  - Video conference with grid layout
  - Audio-only mode
  - Control bar for mic/camera/screen share

### 3. Webhook Handling

- API endpoint: `/api/livekit/webhook` (POST)
- Processes LiveKit events:
  - Room started/finished
  - Participants joined/left
  - Records events in the database

## Usage

### Adding Video Chat to a Channel

```jsx
import { VideoChat } from '@/components/VideoChat';

// In your channel component:
<VideoChat 
  userId={currentUser.id}
  channelId={channel.id}
  channelType={channel.type} // 'voice' or 'video'
/>
```

## Troubleshooting

1. **Token generation fails**: Check that your LiveKit API key and secret are correct
2. **Cannot connect to room**: Verify that your LiveKit server URL is correct and accessible
3. **Webhook events not received**: Ensure your webhook URL is correctly set in the LiveKit dashboard 