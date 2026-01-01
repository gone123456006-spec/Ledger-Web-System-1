Local hosting instructions

Node (recommended):
- Ensure Node.js is installed (v14+).
- From the workspace root run:

  npm start

- Open http://localhost:8000

PowerShell helper (Windows):
- Run `.




















- To change the port set the `PORT` environment variable or pass `-Port` to the PowerShell helper.- The server serves files from the `public` directory at the project root.Notes:- Open http://localhost:8000 in your browser.Access:  python -m http.server 8000 --directory public- If you don't have Node, and have Python 3 installed, run:Python (fallback):  start-local.bat- Double-click `start-local.bat` or run:Batch helper (Windows cmd):  .\start-local.ps1 -Port 8000un start-local.ps1` or from PowerShell: