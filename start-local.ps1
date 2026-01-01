param([int]$Port = 8000)
$env:PORT = $Port
node server.js
