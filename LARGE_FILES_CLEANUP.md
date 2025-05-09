# Large Files Cleanup Guide

This document provides a list of files and directories that should be excluded from your GitHub repository to reduce its size and avoid hitting GitHub's file size limits.

## Files and Directories to Exclude

### Build and Cache Directories
- `.next/` - Next.js build output
- `node_modules/` - Dependencies (already in .gitignore)
- `.vercel/` - Vercel deployment files
- `.turbo/` - Turbo cache
- `out/` - Static export directory
- `build/` - Build output
- `dist/` - Distribution files
- `.cache/` - Cache directories
- `storybook-static/` - Storybook build output

### Development Files
- `.env` - Environment variables (already in .gitignore)
- `.env.local` - Local environment variables
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables
- `*.log` - Log files
- `.eslintcache` - ESLint cache
- `.stylelintcache` - Stylelint cache
- `*.tsbuildinfo` - TypeScript build info

### Large Media Files
- `public/uploads/` - User uploaded content
- `public/images/` - Large image files (consider image optimization)
- `*.mp4`, `*.mov`, `*.avi`, etc. - Video files
- `*.psd`, `*.ai`, `*.sketch` - Design files
- `*.zip`, `*.tar.gz`, `*.rar` - Archive files
- `*.iso`, `*.dmg` - Disk images

### Database Files
- `*.sqlite` - SQLite database files
- `*.db` - Database files
- `mongodb/` - Local MongoDB data
- `dump/` - Database dumps

### IDE and Editor Files
- `.vscode/` - VS Code settings (already in .gitignore)
- `.idea/` - IntelliJ IDEA settings (already in .gitignore)
- `*.sublime-*` - Sublime Text files
- `*.swp`, `*.swo` - Vim swap files

### Temporary Files
- `.DS_Store` - macOS folder attributes (already in .gitignore)
- `Thumbs.db` - Windows thumbnail cache
- `tmp/` - Temporary files
- `.temp/` - Temporary files

## Recommendations for Large Files

1. **Use Git LFS for Large Files**
   If you need to track large files, consider using [Git Large File Storage (LFS)](https://git-lfs.github.com/).

2. **Store Media on External Services**
   - Use a CDN for images and videos
   - Use cloud storage (S3, Google Cloud Storage, etc.)

3. **Clean Up Existing Large Files**
   If large files are already in your repository, use BFG Repo-Cleaner or git-filter-repo to remove them:
   ```bash
   # Install BFG
   # Remove files larger than 10MB
   bfg --strip-blobs-bigger-than 10M
   ```

4. **Monitor Repository Size**
   Regularly check your repository size with:
   ```bash
   git count-objects -vH
   ```

## Specific Large Files Detected in This Repository

Based on our analysis, these specific files/directories should be removed or added to .gitignore:

1. `.next/cache/` - Contains large build cache files
2. `node_modules/.cache/` - Package manager cache files
3. Any large image or media files in `public/`
4. Any database dumps or backups
5. Any log files or debug outputs

## How to Update .gitignore

Add these patterns to your `.gitignore` file:

```
# Build and cache
.next/cache/
.turbo/
.swc/
.eslintcache
.stylelintcache

# Large media
public/uploads/
*.mp4
*.mov
*.avi
*.webm
*.mp3
*.wav
*.psd
*.ai
*.sketch

# Archives and compressed files
*.zip
*.tar.gz
*.rar
*.7z
*.iso
*.dmg

# Database
*.sqlite
*.db
mongodb/
dump/

# Logs and debugging
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
debug.log

# Temporary files
.temp/
.tmp/
tmp/
temp/
```

## Next Steps

1. Update your `.gitignore` file with the patterns above
2. Clean up any large files already in your repository
3. Consider using Git LFS for necessary large files
4. Set up pre-commit hooks to prevent committing large files
