param(
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'

$toolDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDirectory = Split-Path -Parent $toolDirectory
$parentDirectory = Split-Path -Parent $appDirectory
$appFolderName = Split-Path -Leaf $appDirectory

# Wird Druckverlust innerhalb der gemeinsamen Homepage abgelegt, wird die
# Homepage als Serverwurzel verwendet. Dadurch funktionieren auch Links
# zwischen Hauptseite und Berechnungstool.
$serveRoot = $appDirectory
$openPath = '/index.html'

if ((Test-Path (Join-Path $parentDirectory 'index.html')) -and
    ($appFolderName -match '(?i)^Druckverlust')) {
    $serveRoot = $parentDirectory
    $encodedFolder = [Uri]::EscapeDataString($appFolderName)
    $openPath = '/' + $encodedFolder + '/index.html'
}

function Get-FreePort {
    param([int]$StartPort)

    for ($candidate = $StartPort; $candidate -le ($StartPort + 20); $candidate++) {
        $probe = $null
        try {
            $probe = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $candidate)
            $probe.Start()
            $probe.Stop()
            return $candidate
        }
        catch {
            if ($probe) {
                try { $probe.Stop() } catch { }
            }
        }
    }

    throw "Zwischen Port $StartPort und $($StartPort + 20) wurde kein freier Port gefunden."
}

function Get-MimeType {
    param([string]$Path)

    switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        '.html' { return 'text/html; charset=utf-8' }
        '.htm'  { return 'text/html; charset=utf-8' }
        '.css'  { return 'text/css; charset=utf-8' }
        '.js'   { return 'text/javascript; charset=utf-8' }
        '.mjs'  { return 'text/javascript; charset=utf-8' }
        '.json' { return 'application/json; charset=utf-8' }
        '.webmanifest' { return 'application/manifest+json; charset=utf-8' }
        '.xml'  { return 'application/xml; charset=utf-8' }
        '.svg'  { return 'image/svg+xml' }
        '.png'  { return 'image/png' }
        '.jpg'  { return 'image/jpeg' }
        '.jpeg' { return 'image/jpeg' }
        '.gif'  { return 'image/gif' }
        '.webp' { return 'image/webp' }
        '.ico'  { return 'image/x-icon' }
        '.pdf'  { return 'application/pdf' }
        '.xlsx' { return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        '.dvp'  { return 'application/octet-stream' }
        default { return 'application/octet-stream' }
    }
}

function Send-Response {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [byte[]]$Content,
        [string]$ContentType,
        [bool]$HeadOnly = $false
    )

    $headers = @(
        "HTTP/1.1 $StatusCode $StatusText"
        "Content-Type: $ContentType"
        "Content-Length: $($Content.Length)"
        'Cache-Control: no-cache, no-store, must-revalidate'
        'Pragma: no-cache'
        'Expires: 0'
        'X-Content-Type-Options: nosniff'
        'Connection: close'
        ''
        ''
    ) -join "`r`n"

    $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)

    if (-not $HeadOnly -and $Content.Length -gt 0) {
        $Stream.Write($Content, 0, $Content.Length)
    }
}

$Port = Get-FreePort -StartPort $Port
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

$url = "http://127.0.0.1:$Port$openPath"

Write-Host 'Druckverlust Pro ist bereit.' -ForegroundColor Green
Write-Host "Serverordner: $serveRoot"
Write-Host "Adresse:      $url"
Write-Host ''
Write-Host 'Dieses Fenster zum Beenden schliessen oder STRG+C druecken.' -ForegroundColor Yellow
Write-Host ''

Start-Process $url

$rootWithSeparator = [IO.Path]::GetFullPath($serveRoot.TrimEnd('\') + '\')

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()

        try {
            $stream = $client.GetStream()
            $stream.ReadTimeout = 5000
            $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                continue
            }

            do {
                $headerLine = $reader.ReadLine()
            } while ($null -ne $headerLine -and $headerLine -ne '')

            $parts = $requestLine.Split(' ')
            if ($parts.Count -lt 2) {
                $body = [Text.Encoding]::UTF8.GetBytes('Ungueltige Anfrage.')
                Send-Response -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -Content $body -ContentType 'text/plain; charset=utf-8'
                continue
            }

            $method = $parts[0].ToUpperInvariant()
            $target = $parts[1]
            $headOnly = $method -eq 'HEAD'

            if ($method -ne 'GET' -and -not $headOnly) {
                $body = [Text.Encoding]::UTF8.GetBytes('Nur GET und HEAD werden unterstuetzt.')
                Send-Response -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -Content $body -ContentType 'text/plain; charset=utf-8'
                continue
            }

            $rawPath = ($target -split '\?', 2)[0]
            $decodedPath = [Uri]::UnescapeDataString($rawPath)
            $relativePath = $decodedPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)

            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = 'index.html'
            }

            $requestedPath = [IO.Path]::GetFullPath((Join-Path $serveRoot $relativePath))

            if (-not $requestedPath.StartsWith($rootWithSeparator, [StringComparison]::OrdinalIgnoreCase) -and
                -not $requestedPath.Equals($rootWithSeparator.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) {
                $body = [Text.Encoding]::UTF8.GetBytes('Zugriff verweigert.')
                Send-Response -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -Content $body -ContentType 'text/plain; charset=utf-8' -HeadOnly $headOnly
                continue
            }

            if (Test-Path $requestedPath -PathType Container) {
                $requestedPath = Join-Path $requestedPath 'index.html'
            }

            if (-not (Test-Path $requestedPath -PathType Leaf)) {
                $body = [Text.Encoding]::UTF8.GetBytes('Datei nicht gefunden.')
                Send-Response -Stream $stream -StatusCode 404 -StatusText 'Not Found' -Content $body -ContentType 'text/plain; charset=utf-8' -HeadOnly $headOnly
                continue
            }

            $content = [IO.File]::ReadAllBytes($requestedPath)
            $mimeType = Get-MimeType -Path $requestedPath
            Send-Response -Stream $stream -StatusCode 200 -StatusText 'OK' -Content $content -ContentType $mimeType -HeadOnly $headOnly
        }
        catch {
            try {
                if ($stream) {
                    $body = [Text.Encoding]::UTF8.GetBytes('Interner Fehler beim lokalen Server.')
                    Send-Response -Stream $stream -StatusCode 500 -StatusText 'Internal Server Error' -Content $body -ContentType 'text/plain; charset=utf-8'
                }
            }
            catch { }
        }
        finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
