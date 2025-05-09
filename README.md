# Gangio - Real-Time Chat Platform

Gangio is a full-featured chat and communication platform inspired by Discord. It provides real-time messaging, server-based communities, direct messaging, voice/video communication, and social features in a modern, responsive interface.

## Features

*   **Real-time Communication:** Text, Voice, and Video channels.
*   **Server Management:** Create/join servers, role & permission system, channel/category organization, invite system.
*   **User Management:** Authentication (registration/login), profiles (avatar, banner, status, bio), friend system (requests/list), Steam integration.
*   **Messaging System:** Rich text messages, attachments, reactions, mentions, message history, direct messaging.
*   **Responsive UI:** Clean, modern interface inspired by Discord, built with Tailwind CSS.
*   **Performance:** Optimized for speed and efficiency.

## Tech Stack

*   **Framework:** Next.js (React)
*   **Styling:** Tailwind CSS
*   **Database:** MongoDB
*   **Real-time:** WebSockets (implementation details may vary, e.g., Socket.IO, LiveKit)
*   **Authentication:** NextAuth.js (implied for session management and providers like Steam)


## Environment Var.
* MONGODB_URI=mongodb+srv://ertact:Ertacdemm111@project0-db.ahspvi3.mongodb.net/?retryWrites=true&w=majority&appName=project0-db
NEXT_DISABLE_OPTIMIZE_CSS=true
LIVEKIT_URL=wss://gangio-1iknik3h.livekit.cloud
LIVEKIT_API_KEY=APIBXyoN7WvttQT
LIVEKIT_API_SECRET=d7LUGmuU7w222rE6TOXS9SOs3Duooi5zKbiEwffMbqg
NEXT_PUBLIC_LIVEKIT_URL=wss://gangio-1iknik3h.livekit.cloud
TENOR_API_KEY=AIzaSyB2X459F0-KL-EvHmwHCNlJcKHSFuiD4GI
MONGODB_DB_NAME=project0-db

# Steam Credentials
STEAM_API_KEY=470E0D7626517760C100B903BD7AA412
# Add NEXTAUTH_URL here once provided by the user
# Example: NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://gangio.vercel.app
## Database

The application utilizes MongoDB for data storage. Key collections include:

*   `users`
*   `servers`
*   `serverMembers` (**Note:** Uses camelCase)
*   `roles`
*   `categories`
*   `channels`
*   `messages`
*   `directMessages`
*   `badges`

Performance is optimized through database indexing on frequently queried fields.

**Important:** For detailed schema information, indexing strategies, and specific development guidelines (like collection naming conventions), please refer to [`gangio.md`](mdc:gangio.md).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd elivechit
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Set up environment variables:**
    *   Copy `.env.example` to `.env.local`.
    *   Fill in your MongoDB connection string (`MONGODB_URI`).
    *   Add any necessary API keys or secrets (e.g., `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `STEAM_API_KEY`, `STEAM_CLIENT_ID`, `STEAM_CLIENT_SECRET`, LiveKit keys, etc.).

4.  **Run the development server:**
    ```bash
    npm run dev
    # or yarn dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Notes

*   Always refer to [`gangio.md`](mdc:gangio.md) for the latest database schema and development conventions.
*   Use the `getCollection(db, 'collectionName')` utility from `lib/db.ts` for consistent database collection access, especially for `serverMembers`.

## Contributing

(Add guidelines for contributing if applicable)

## License

(Specify project license if applicable) 