cd d:/github/scorex-backend/scorex-backend
npx tsc 2>&1 | Out-File -FilePath "build_result.txt" -Encoding UTF8
Get-Content "build_result.txt"

