# PowerShell script to find and clean up large files in the Git repository

# Find large files in the repository (files larger than 1MB)
Write-Host "Finding large files in the repository (>1MB)..." -ForegroundColor Cyan
git rev-list --objects --all | 
    git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | 
    Where-Object { $_ -match '^blob' } | 
    ForEach-Object { $_ -replace '^blob (\S+) (\S+) (.*)', '$1 $2 $3' } | 
    Where-Object { [int]($_ -split ' ')[1] -gt 1MB } | 
    Sort-Object { [int]($_ -split ' ')[1] } -Descending | 
    ForEach-Object { 
        $hash, $size, $name = $_ -split ' ', 3
        $sizeInMB = [math]::Round([int]$size / 1MB, 2)
        "$name ($sizeInMB MB)" 
    } | Tee-Object -FilePath "large-files-list.txt"

Write-Host "`nLarge files have been saved to 'large-files-list.txt'" -ForegroundColor Green

# Clean up temporary files
Write-Host "`nCleaning up temporary files and build artifacts..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed .next directory" -ForegroundColor Green
}

if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed node_modules directory" -ForegroundColor Green
}

# Clean up other directories based on .gitignore
$dirsToClean = @(
    ".turbo",
    ".vercel",
    "out",
    "build",
    "dist",
    ".cache",
    "storybook-static",
    "tmp",
    "temp",
    ".temp",
    ".tmp"
)

foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removed $dir directory" -ForegroundColor Green
    }
}

# Instructions for removing large files from Git history
Write-Host "`nTo remove large files from Git history, you can use BFG Repo-Cleaner:" -ForegroundColor Yellow
Write-Host "1. Download BFG from https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Yellow
Write-Host "2. Run: java -jar bfg.jar --strip-blobs-bigger-than 10M" -ForegroundColor Yellow
Write-Host "3. Run: git reflog expire --expire=now --all && git gc --prune=now --aggressive" -ForegroundColor Yellow

# Instructions for pushing to GitHub
Write-Host "`nAfter cleaning up, you can push to GitHub with:" -ForegroundColor Yellow
Write-Host "git add ." -ForegroundColor Yellow
Write-Host "git commit -m 'Clean up large files and update .gitignore'" -ForegroundColor Yellow
Write-Host "git push" -ForegroundColor Yellow

Write-Host "`nIf you encounter 'file too large' errors during push, identify the specific files and add them to .gitignore" -ForegroundColor Yellow
