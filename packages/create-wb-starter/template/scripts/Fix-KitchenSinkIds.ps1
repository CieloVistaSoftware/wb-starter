$path = Resolve-Path "demos/kitchen-sink.html"
$content = Get-Content $path -Raw

# Tags to process
$tags = @("main", "div", "section", "body", "html")

foreach ($tag in $tags) {
    # Regex: Start tag, not followed by id=
    # Using single quotes for pattern to avoid easy escaping issues
    # But we need $tag, so we use string format
    $pattern = '(?i)<{0}(?![^>]*\bid=[''"])[^>]*>' -f $tag
    
    $content = [Regex]::Replace($content, $pattern, {
        param($match)
        $m = $match
        if (-not $m) { $m = $args[0] }
        
        $orig = $m.Value
        
        if ($orig -match "/>$") {
             return $orig
        }

        $cleanTag = $orig.TrimEnd(">")
        $guid = [guid]::NewGuid().ToString().Substring(0,8)
        $id = "auto-$guid"
        
        # Avoid malformed end
        return "$cleanTag id=""$id"">"
    }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "Updated kitchen-sink.html with IDs"
