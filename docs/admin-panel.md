# Admin Panel Documentation

## Overview
The admin panel provides a secure interface for managing the Gangio platform. It includes features for user management, server management, message moderation, and site settings.

## Access
The admin panel is accessible at `/admin` and requires admin credentials to log in. These credentials are stored securely in the database.

## Features

### Dashboard
- View platform statistics (users, servers, messages, channels)
- Monitor recent user registrations and server creations
- Track platform growth over time

### User Management
- View all registered users
- Search and filter users by various criteria
- Ban/unban users
- View user details including servers, messages, and activity

### Server Management
- View all servers on the platform
- Search and filter servers by various criteria
- Delete or ban problematic servers
- View server details including members, channels, and activity

### Message Management
- Monitor messages across the platform
- Search and filter messages by content, user, server, etc.
- Delete inappropriate messages
- View message context and history

### Settings
- **General Settings**
  - Toggle maintenance mode (restricts access to admins only)
  - Enable/disable user registration
  
- **reCAPTCHA Settings**
  - Enable/disable reCAPTCHA protection on the signup page
  - Configure reCAPTCHA site key and secret key
  
- **Terms & Conditions**
  - Edit the platform's terms and conditions
  - Track when terms were last updated
  - The terms are displayed to users on the `/terms` page

- **Database Management**
  - Backup database
  - Optimize collections
  - Clear cache

## Security Features

### Authentication
- The admin panel uses a custom credentials provider in NextAuth.js
- Admin credentials are securely stored with bcrypt hashing
- JWT tokens include an admin role flag for authorization

### Role-Based Access Control
- Only users with the admin role can access the admin panel
- All admin routes are protected with server-side authentication checks

### Timeout Protection
- All database operations include timeout protection to prevent Vercel function timeouts
- Parallel processing for database operations to improve performance
- Fallback mechanisms for handling database connection issues

## Technical Implementation

### Admin Initialization
- Run `node scripts/init-admin.js` to initialize the admin user and site settings
- This script creates the admin user with default credentials and sets up initial site settings

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB_NAME`: The name of the database
- `NEXTAUTH_SECRET`: Secret key for NextAuth
- `ADMIN_USERNAME`: Admin username (optional, defaults to "admin")
- `ADMIN_PASSWORD_HASH`: Bcrypt hash of the admin password (optional)

## Best Practices
1. Change the default admin credentials after initial setup
2. Regularly backup the database
3. Monitor the admin activity logs
4. Keep the terms and conditions up to date
5. Test the reCAPTCHA integration periodically

## Troubleshooting
- If you encounter timeout issues with database operations, check the MongoDB connection settings
- If the admin panel is not accessible, verify that the admin user exists in the database
- For reCAPTCHA issues, ensure the site key and secret key are correctly configured
