# Druckverlust Pro – Phase 18.19 Cleanup-Hilfe
# Dieses Script löscht alte Dateien, die im bereinigten Gesamtprojekt nicht mehr enthalten sind.
# Bitte im Projektstamm ausführen, also dort, wo index.html und src/main.js liegen.

$required = @("index.html", "src/main.js")
foreach ($item in $required) {
  if (-not (Test-Path $item)) {
    Write-Error "Bitte Script im Projektstamm ausführen. Fehlend: $item"
    exit 1
  }
}

$paths = @(
  "GEAENDERTE_DATEIEN_18_12c.txt",
  "GEAENDERTE_DATEIEN_18_12d.txt",
  "src/app.js",
  "src/style.css",
  "src/ui/styles.css",
  "src/calculation/CalculationEngine.js",
  "src/core/FormPartEngine.js",
  "src/core/FormPartRegistry.js",
  "src/core/ProjectEngine.js",
  "src/core/ProjectSchema.js",
  "src/core/state.js",
  "src/formteile/FormPartEngine.js",
  "src/formteile/FormPartLibrary.js",
  "src/formteile/formteile.js",
  "src/pdf/PdfReportEngine.js",
  "src/project/ProjectEngine.js",
  "src/project/ProjectModel.js",
  "src/project/ProjectSchema.js",
  "src/project/storage.js",
  "src/services/ProjectCalculationService.js"
)

foreach ($path in $paths) {
  if (Test-Path $path) {
    Remove-Item -LiteralPath $path -Force
    Write-Host "Gelöscht: $path"
  }
}

Get-ChildItem "tests/reference" -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -like "*.html" -or $_.Name -like "*.test.js"
} | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName -Force
  Write-Host "Gelöscht: $($_.FullName)"
}

Write-Host "Cleanup 18.19 abgeschlossen."
