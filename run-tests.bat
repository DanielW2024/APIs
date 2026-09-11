@echo off
REM ============================================================
REM ARCHIVO: run-tests.bat
REM PROPÓSITO: Ejecutar diferentes tipos de pruebas fácilmente
REM ============================================================

echo ========================================
echo     K6 TEST FRAMEWORK - EJECUTOR
echo ========================================
echo.
echo Selecciona el tipo de prueba:
echo.
echo [1] Smoke Test   (Rápido - valida que funciona)
echo [2] Load Test    (Normal - carga esperada)
echo [3] Stress Test  (Extremo - busca punto de quiebre)
echo [4] Spike Test   (Pico repentino)
echo [5] Soak Test    (Resistencia - larga duración)
echo [6] Todas las pruebas
echo [7] Salir
echo.

set /p option="Opción (1-7): "

if "%option%"=="1" goto smoke
if "%option%"=="2" goto load
if "%option%"=="3" goto stress
if "%option%"=="4" goto spike
if "%option%"=="5" goto soak
if "%option%"=="6" goto all
if "%option%"=="7" goto exit

:smoke
echo.
echo 🔥 Ejecutando Smoke Test...
k6 run tests/smoke/smoke-test.js --out json=reports/smoke-report.json
echo ✅ Smoke Test completado
goto end

:load
echo.
echo 📊 Ejecutando Load Test...
k6 run tests/load/load-test.js --out json=reports/load-report.json
echo ✅ Load Test completado
goto end

:stress
echo.
echo 💪 Ejecutando Stress Test...
k6 run tests/stress/stress-test.js --out json=reports/stress-report.json
echo ✅ Stress Test completado
goto end

:spike
echo.
echo ⚡ Ejecutando Spike Test...
k6 run tests/spike/spike-test.js --out json=reports/spike-report.json
echo ✅ Spike Test completado
goto end

:soak
echo.
echo 🕐 Ejecutando Soak Test (esto tomará varias horas)...
k6 run tests/soak/soak-test.js --out json=reports/soak-report.json
echo ✅ Soak Test completado
goto end

:all
echo.
echo 🚀 Ejecutando TODAS las pruebas...
echo.
call :smoke
call :load
call :stress
echo ✅ Todas las pruebas completadas
goto end

:end
echo.
echo 📁 Reportes guardados en carpeta /reports/
pause

:exit
echo 👋 Hasta luego!