# check-archived-file-usage.ps1
param (
    [string[]]$ArchivedFiles,
    [string]$ProjectRoot = "."
)

function Test-FileUsage {
    param (
        [string]$FilePath,
        [string]$ProjectRoot
    )

    $FileName = Split-Path $FilePath -Leaf
    $BaseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    
    # Calculate the relative path from the project root to the archived file
    # This is crucial for matching import/require paths
    $fullArchivedFilePath = (Resolve-Path $FilePath).Path
    $fullProjectRoot = (Resolve-Path $ProjectRoot).Path
    
    # Ensure fullProjectRoot ends with a backslash for consistent substring operation
    if (-not $fullProjectRoot.EndsWith("\")) {
        $fullProjectRoot += "\"
    }
    
    $RelativePathForImport = $fullArchivedFilePath.Replace($fullProjectRoot, "")
    $RelativePathForImport = $RelativePathForImport.Replace("\", "/") # Standardize path separators for import statements

    Write-Host "Checking usage for: $FilePath" -ForegroundColor Cyan

    # Construct search patterns for various import/require styles
    # We need to escape special regex characters in $BaseName and $RelativePathForImport
    $escapedBaseName = [regex]::Escape($BaseName)
    $escapedRelativePathForImport = [regex]::Escape($RelativePathForImport)
    
    # Try to match the full relative path, or just the base name
    # Example: import SomeComponent from '../archived/SomeComponent'
    # Example: require('../archived/SomeComponent')
    # Example: import { SomeUtil } from '../archived/someUtil'
    $patterns = @(
        # Matches full relative path, potentially with leading ./ or ../ or /src/
        "import\s+[^'\x22]*['\x22]((\.\.?/)|/src/)[^'\x22]*$escapedRelativePathForImport['\x22]",
        "require\(['\x22]((\.\.?/)|/src/)[^'\x22]*$escapedRelativePathForImport['\x22]\)",
        
        # Matches base name in paths, assuming no extension or common extensions
        # This is less precise but catches cases like import 'path/to/MyFile' where extension is omitted
        "import\s+[^'\x22]*['\x22][^'\x22]*/$escapedBaseName(\.jsx|\.js|\.ts|\.tsx)?['\x22]",
        "require\(['\x22][^'\x22]*/$escapedBaseName(\.jsx|\.js|\.ts|\.tsx)?['\x22]\)"
    )

    $found = $false

    # Get all potential source files, excluding the archived directory itself
    $sourceFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Include *.js, *.jsx, *.ts, *.tsx |
                   Where-Object { $_.FullName -notmatch [regex]::Escape($fullArchivedFilePath).Replace("\", "\\") } | # Exclude the archived folder content
                   Where-Object { $_.FullName -notmatch [regex]::Escape((Join-Path $ProjectRoot "src/archived")).Replace("\", "\\") } # Exclude the archived folder itself from search

    foreach ($pattern in $patterns) {
        Write-Verbose "Searching with pattern: $pattern"
        
        $results = $sourceFiles | Select-String -Pattern $pattern -CaseSensitive -ErrorAction SilentlyContinue

        if ($results) {
            $found = $true
            Write-Host "  Used in:" -ForegroundColor Green
            $results | ForEach-Object {
                $relativeFoundPath = $_.Path.Replace($fullProjectRoot, "")
                Write-Host "    $relativeFoundPath (Line $($_.LineNumber)): $($_.Line.Trim())"
            }
            break # Found a reference, no need to check other patterns for this file
        }
    }

    if (-not $found) {
        Write-Host "  No direct usage found." -ForegroundColor Yellow
    }
    Write-Host "" # Newline for readability
}

# Get list of files in src/archived
$archivedDir = Join-Path $ProjectRoot "src/archived"
$allArchivedFiles = Get-ChildItem -Path $archivedDir -File | Select-Object -ExpandProperty FullName

# If specific files are passed, use them, otherwise use all
$filesToCheck = if ($ArchivedFiles) { $ArchivedFiles } else { $allArchivedFiles }

if ($filesToCheck.Count -eq 0) {
    Write-Warning "No files found to check in '$archivedDir' or provided in \"`$ArchivedFiles`" parameter."
    exit 1
}

Write-Host "Starting usage check for $($filesToCheck.Count) archived files..." -ForegroundColor Green
Write-Host "Searching for references in: *.js, *.jsx, *.ts, *.tsx (excluding src/archived directory)" -ForegroundColor DarkGray
Write-Host ""

foreach ($file in $filesToCheck) {
    Test-FileUsage -FilePath $file -ProjectRoot $ProjectRoot
}

Write-Host "Usage check complete." -ForegroundColor Green

