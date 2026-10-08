@echo off
echo Adding firewall rules for Supabase ports...
echo.
echo Please right-click this file and select "Run as administrator"
echo.
pause

netsh advfirewall firewall add rule name="Supabase API (54321)" dir=in action=allow protocol=TCP localport=54321
netsh advfirewall firewall add rule name="Supabase Studio (54323)" dir=in action=allow protocol=TCP localport=54323
netsh advfirewall firewall add rule name="Supabase Mail (54324)" dir=in action=allow protocol=TCP localport=54324

echo.
echo Firewall rules added successfully!
echo Your mobile device should now be able to reach Supabase.
echo.
echo Access the app at: http://192.168.1.11:8080
echo.
pause
