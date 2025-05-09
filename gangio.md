Your specs:
Follow the user's requirements carefully & to the letter.
First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.
Confirm, then write code!
Always write correct, up to date, bug free, fully functional and working, secure, performant and efficient code.
Fully implement all requested functionality.
Ensure code is complete! Verify thoroughly finalized.
Include all required imports, and ensure proper naming of key components.
Be concise. Minimize any other prose.
Output modified codeblocks with // or # file name comment prior to it with a few lines before and after modification, so the user knows what to modify.
Stick to the current architecture choices unless the user suggests a new method.
# Database Schema

The application uses MongoDB for data storage. Below is the current schema:

## Collections

### Users
```typescript
interface User {
  _id?: ObjectId;
  id: string;
  name: string;
  discriminator: string;
  email?: string;
  passwordHash?: string;
  avatarUrl?: string;
  bannerUrl?: string; // Profile banner
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'focus' | 'invisible';
  isBot?: boolean;
  game?: string;
  position?: string; // Job position or title
  company?: string; // Company or organization
  bio?: string; // User bio
  pronouns?: string; // User pronouns
  badges?: Badge[]; // Special badges
  isNew?: boolean; // Flag for new users
  friendIds?: string[]; // IDs of friends
  incomingFriendRequests?: string[]; // IDs of users who sent friend requests
  outgoingFriendRequests?: string[]; // IDs of users who received friend requests
  steamId?: string;      // User's unique Steam ID (64-bit)
  steamProfileUrl?: string; // URL to user's Steam profile
  steamAvatarUrl?: string; // URL to user's Steam avatar
  createdAt: Date;
  updatedAt: Date;
}
```

### Badges
```typescript
interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color?: string;
}
```

### Roles
```typescript
interface Role {
  _id?: ObjectId;
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  permissions: {
    admin: boolean;
    kick: boolean;
    ban: boolean;
    manageChannels: boolean;
    manageRoles: boolean;
    manageServer: boolean;
  };
  channelPermissions?: {
    [channelId: string]: {
      read: boolean;
      write: boolean;
      react: boolean;
      embed: boolean;
      upload: boolean;
    }
  };
  serverId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Channels
```typescript
interface Channel {
  _id?: ObjectId;
  id: string;
  name: string;
  type: 'text' | 'voice' | 'video';
  serverId: string;
  categoryId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Categories
```typescript
interface Category {
  _id?: ObjectId;
  id: string;
  name: string;
  serverId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Servers
```typescript
interface Server {
  _id?: ObjectId;
  id: string;
  name: string;
  description?: string;
  icon?: string | null;
  iconUrl?: string | null; // URL to the server icon
  banner?: string | null;
  isOfficial?: boolean;
  ownerId: string;
  inviteCode?: string;
  defaultChannelId?: string;
  memberCount?: number; // Number of members in the server
  createdAt: Date;
  updatedAt: Date;
}
```

### ServerMembers
```typescript
interface ServerMember {
  _id?: ObjectId;
  userId: string;
  serverId: string;
  roleIds: string[];
  nickname?: string;
  joinedAt: Date;
}
```

### Messages
```typescript
interface Message {
  _id?: ObjectId;
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string;
  attachments?: {
    id: string;
    url: string;
    type: 'image' | 'video' | 'audio' | 'file';
    name: string;
    size?: number;
  }[];
  mentions?: string[];
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];
  isPinned?: boolean;
  edited?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### DirectMessages
Similar to the Messages collection but for private communications between users.

```typescript
interface DirectMessage {
  _id?: ObjectId;
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  attachments?: {
    id: string;
    url: string;
    type: 'image' | 'video' | 'audio' | 'file';
    name: string;
    size?: number;
  }[];
  mentions?: string[];
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];
  read: boolean;
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Database Connection
The application connects to MongoDB using the official MongoDB client with optimized connection parameters for performance and reliability.

## Indexes

To optimize query performance, the following indexes should be created for each collection:

### Users Collection Indexes
```javascript
// Create unique index on email for faster lookup during authentication
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });

// Create unique index on id for faster lookups by user ID
db.users.createIndex({ id: 1 }, { unique: true });

// Create index on name and discriminator for user search
db.users.createIndex({ name: 1, discriminator: 1 });

// Create index on status for finding online users
db.users.createIndex({ status: 1 });

// Create index on friendIds for friend list operations
db.users.createIndex({ friendIds: 1 });
```

### Roles Collection Indexes
```javascript
// Create unique index on id
db.roles.createIndex({ id: 1 }, { unique: true });

// Create compound index on serverId and name
db.roles.createIndex({ serverId: 1, name: 1 });

// Create index on serverId for faster role lookup per server
db.roles.createIndex({ serverId: 1 });
```

### Channels Collection Indexes
```javascript
// Create unique index on id
db.channels.createIndex({ id: 1 }, { unique: true });

// Create compound index on serverId and type
db.channels.createIndex({ serverId: 1, type: 1 });

// Create compound index on serverId and categoryId for grouping channels
db.channels.createIndex({ serverId: 1, categoryId: 1 });

// Create index on position for ordering channels
db.channels.createIndex({ serverId: 1, position: 1 });
```

### Categories Collection Indexes
```javascript
// Create unique index on id
db.categories.createIndex({ id: 1 }, { unique: true });

// Create index on serverId for faster category lookup per server
db.categories.createIndex({ serverId: 1 });

// Create compound index on serverId and position for ordering
db.categories.createIndex({ serverId: 1, position: 1 });
```

### Servers Collection Indexes
```javascript
// Create unique index on id
db.servers.createIndex({ id: 1 }, { unique: true });

// Create index on ownerId to find servers owned by a user
db.servers.createIndex({ ownerId: 1 });

// Create unique index on inviteCode for invite link lookups
db.servers.createIndex({ inviteCode: 1 }, { unique: true, sparse: true });

// Create text index on name and description for server search
db.servers.createIndex({ name: "text", description: "text" });
```

### ServerMembers Collection Indexes
```javascript
// Create compound index for looking up a user's membership in a server
db.serverMembers.createIndex({ userId: 1, serverId: 1 }, { unique: true });

// Create index on serverId to get all members of a server
db.serverMembers.createIndex({ serverId: 1 });

// Create compound index on serverId and joinedAt for sorting members by join date
db.serverMembers.createIndex({ serverId: 1, joinedAt: 1 });
```

### Messages Collection Indexes
```javascript
// Create unique index on id
db.messages.createIndex({ id: 1 }, { unique: true });

// Create compound index on channelId and createdAt for message history
db.messages.createIndex({ channelId: 1, createdAt: -1 });

// Create index on authorId for finding messages by author
db.messages.createIndex({ authorId: 1 });

// Create compound index on serverId and channelId
db.messages.createIndex({ serverId: 1, channelId: 1 });

// Create index on mentions for @mention lookups
db.messages.createIndex({ mentions: 1 });

// Create index on isPinned for pinned messages
db.messages.createIndex({ channelId: 1, isPinned: 1 }, { sparse: true });
```

### DirectMessages Collection Indexes
```javascript
// Create unique index on id
db.directMessages.createIndex({ id: 1 }, { unique: true });

// Create compound index for conversations between users, sorted by time
db.directMessages.createIndex({ 
  senderId: 1, 
  recipientId: 1, 
  createdAt: -1 
});

// Create reverse compound index for finding messages regardless of sender/recipient
db.directMessages.createIndex({ 
  recipientId: 1, 
  senderId: 1, 
  createdAt: -1 
});

// Create index for unread messages
db.directMessages.createIndex({ recipientId: 1, read: 1 });
```

# Database Schema Update

In our database schema, we've standardized on camelCase naming for collections. This is an important update that affects all database operations.

## Collection Naming Convention Update

We've renamed the following collections to follow camelCase naming:

- `server_members` → `serverMembers`

**IMPORTANT**: All database operations should use `serverMembers` collection, not `server_members`. Use the `getCollection` utility function to ensure consistent collection names:

```typescript
import { getCollection } from '@/lib/db';

// Use this instead of db.collection('server_members')
const members = await getCollection(db, 'serverMembers').find({ serverId }).toArray();
```

## Complete Database Schema

Our application uses MongoDB with the following collections and schemas:

### Users Collection

```typescript
interface User {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  name: string;        // Username
  discriminator: string; // 4-digit discriminator (e.g. #1234)
  email: string;       // User's email address (unique)
  passwordHash: string; // Hashed password (never store plain passwords)
  avatarUrl?: string;  // URL to user's avatar image
  status?: 'online' | 'offline' | 'idle' | 'dnd'; // User's current status
  customStatus?: string; // User's custom status message
  friendIds?: string[]; // Array of user IDs who are friends
  incomingFriendRequests?: string[]; // Array of user IDs with pending friend requests
  outgoingFriendRequests?: string[]; // Array of user IDs that received friend requests
  badges?: string[];   // Array of badge IDs the user has
  steamId?: string;      // User's unique Steam ID (64-bit)
  steamProfileUrl?: string; // URL to user's Steam profile
  steamAvatarUrl?: string; // URL to user's Steam avatar
  createdAt: Date;     // When the account was created
  updatedAt: Date;     // When the account was last updated
}
```

### Servers Collection

```typescript
interface Server {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  name: string;        // Server name
  description?: string; // Server description
  ownerId: string;     // User ID of server owner
  icon?: string;       // URL to server icon
  banner?: string;     // URL to server banner
  inviteCode?: string; // Unique invitation code
  isVerified?: boolean; // Whether the server is verified
  isPartnered?: boolean; // Whether the server is partnered
  tags?: string[];     // Array of tags for categorization
  createdAt: Date;     // When the server was created
  updatedAt: Date;     // When the server was last updated
}
```

### ServerMembers Collection (formerly server_members)

```typescript
interface ServerMember {
  _id: ObjectId;       // MongoDB internal ID
  userId: string;      // User ID of the member
  serverId: string;    // Server ID the member belongs to
  roleIds: string[];   // Array of role IDs assigned to the member
  nickname?: string;   // Optional nickname specific to this server
  joinedAt: Date;      // When the user joined the server
}
```

### Roles Collection

```typescript
interface Role {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  name: string;        // Role name
  color: string;       // Role color in hex format (e.g. #FF5500)
  serverId: string;    // Server ID the role belongs to
  permissions: string[]; // Array of permission strings
  position: number;    // Role hierarchy position (higher = more authority)
  createdAt: Date;     // When the role was created
  updatedAt: Date;     // When the role was last updated
}
```

### Categories Collection

```typescript
interface Category {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  name: string;        // Category name
  serverId: string;    // Server ID the category belongs to
  position: number;    // Display order position
  createdAt: Date;     // When the category was created
  updatedAt: Date;     // When the category was last updated
}
```

### Channels Collection

```typescript
interface Channel {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  name: string;        // Channel name
  type: 'text' | 'voice' | 'announcement' | 'forum'; // Channel type
  serverId: string;    // Server ID the channel belongs to
  categoryId: string;  // Category ID the channel belongs to
  topic?: string;      // Channel topic/description
  position: number;    // Display order within category
  slowMode?: number;   // Slow mode delay in seconds (if enabled)
  isPrivate?: boolean; // Whether the channel is private
  allowedRoleIds?: string[]; // Roles allowed to access (if private)
  createdAt: Date;     // When the channel was created
  updatedAt: Date;     // When the channel was last updated
}
```

### Messages Collection

```typescript
interface Message {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  content: string;     // Message content
  authorId: string;    // User ID of message author
  channelId: string;   // Channel ID the message belongs to
  serverId: string;    // Server ID the message belongs to
  attachments?: string[]; // Array of attachment URLs
  embeds?: any[];      // Array of embed objects
  mentions?: string[]; // Array of user IDs mentioned in the message
  replyTo?: string;    // ID of message being replied to (if any)
  isPinned?: boolean;  // Whether the message is pinned
  editedAt?: Date;     // When the message was last edited
  createdAt: Date;     // When the message was created
}
```

### DirectMessages Collection

```typescript
interface DirectMessage {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  content: string;     // Message content
  senderId: string;    // User ID of message sender
  recipientId: string; // User ID of message recipient
  attachments?: string[]; // Array of attachment URLs
  embeds?: any[];      // Array of embed objects
  read?: boolean;      // Whether the message has been read
  createdAt: Date;     // When the message was created
  editedAt?: Date;     // When the message was last edited
}
```

### Badges Collection

```typescript
interface Badge {
  _id: ObjectId;       // MongoDB internal ID
  id: string;          // UUID for public use
  name: string;        // Badge name
  description: string; // Badge description
  icon: string;        // URL to badge icon
  color?: string;      // Badge color in hex format
  createdAt: Date;     // When the badge was created
}
```

## Important Database Indexes

We maintain indexes on the following fields for performance:

- Users: `id`, `email`, `name+discriminator`, `status`, `friendIds`
- Servers: `id`, `ownerId`, `inviteCode`
- ServerMembers: `userId+serverId` (compound unique index), `serverId`, `serverId+joinedAt`
- Roles: `id`, `serverId+name`, `serverId`
- Channels: `id`, `serverId+type`, `serverId+categoryId`, `serverId+position`
- Categories: `id`, `serverId`, `serverId+position`
- Messages: `id`, `channelId+createdAt`, `authorId`, `serverId+channelId`, `mentions`
- DirectMessages: `id`, `senderId+recipientId+createdAt`, `recipientId+senderId+createdAt`, `recipientId+read`

## Collection Naming Consistency

To maintain consistency across the application, we've implemented a utility function in `lib/db.ts` that should be used for all database operations:

```typescript
import { connectToDatabase, getCollection } from '@/lib/db';

export async function getMembers(serverId: string) {
  const db = await connectToDatabase();
  // This will always use the correct collection name
  return getCollection(db, 'serverMembers').find({ serverId }).toArray();
}
```

The `getCollection` function handles any collection name inconsistencies and ensures the correct collection name is used.