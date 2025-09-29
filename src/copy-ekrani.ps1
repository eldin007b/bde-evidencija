# 1. Nađi sve .js/.jsx fajlove
$files = Get-ChildItem -Path "E:\PWA\1.0\src" -Recurse -Include *.js, *.jsx

# 2. Regex za import
$importPattern = 'import\s+(?:[^{]*\{[^}]*\}|\w+|\*\s+as\s+\w+)\s+from\s+["'']([^"'']+)["'']'

# 3. Za svaki fajl pročitaj sve import-e
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if (-not $content) { continue }

    $imports = [regex]::Matches($content, $importPattern)

    foreach ($imp in $imports) {
        $path = $imp.Groups[1].Value

        # Preskoči node_modules i apsolutne putanje
        if ($path -match '^[@\w]' -or $path -match '^https?://') {
            continue
        }

        if ($path.StartsWith("./") -or $path.StartsWith("../")) {
            $baseDir = $file.DirectoryName
            $possiblePaths = @()

            # Ako putanja nema ekstenziju, probaj više opcija
            if ([System.IO.Path]::GetExtension($path) -eq "") {
                # Probaj .js, .jsx, pa onda kao direktorijum sa index.js/index.jsx
                $possiblePaths += "$path.js", "$path.jsx", "$path/index.js", "$path/index.jsx"
            } else {
                $possiblePaths += $path
            }

            foreach ($relPath in $possiblePaths) {
                $sourcePath = Join-Path $baseDir $relPath
                $resolved = Resolve-Path $sourcePath -ErrorAction SilentlyContinue

                if ($resolved) {
                    $destPath = $resolved.Path.Replace("E:\PWA\1.0", "C:\pwa_test")
                    $destDir = Split-Path $destPath -Parent

                    if (!(Test-Path $destDir)) {
                        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                    }

                    Copy-Item -Path $resolved.Path -Destination $destPath -Force
                    Write-Host "Kopirano: $($resolved.Path) -> $destPath"
                    break # Ne traži dalje ako je pronađeno
                }
            }
        }
    }
}