@echo off
echo ==========================================
echo FIXING DEPENDENCY CONFLICTS
echo ==========================================
echo.
echo 1. Removing node_modules, pnpm-lock.yaml, and pnpm-workspace.yaml...
rmdir /s /q node_modules
del /q pnpm-lock.yaml
del /q pnpm-workspace.yaml

echo.
echo 2. Installing dependencies with pnpm...
echo (Including @heroui/react framer-motion)
call pnpm add @heroui/react framer-motion

echo.
echo ==========================================
echo DONE! You can now run 'pnpm dev'
echo ==========================================
pause
