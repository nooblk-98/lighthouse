@echo off
start "LightHouse Backend" cmd /k "cd server && python -m uvicorn main:app --reload"
start "LightHouse Frontend" cmd /k "cd client && npm run dev"
echo Light House started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
