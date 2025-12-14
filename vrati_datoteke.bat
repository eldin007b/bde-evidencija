@echo off
echo Vracanje datoteka...

move "C:\Project\BD Evidencija\old_project\backup\src\archived" "C:\Project\BD Evidencija\old_project\src\"

move "C:\Project\BD Evidencija\old_project\backup\src\utils\authService.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\utils\exportCsv.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\utils\debugPushNotifications.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\utils\testDataHelpers.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\utils\testNotificationDelivery.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\utils\testNotifications.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\utils\testPushNotifications.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\utils\visualDebugger.js" "C:\Project\BD Evidencija\old_project\src\utils\"
move "C:\Project\BD Evidencija\old_project\backup\src\hooks\useSimpleDriverAuth.js" "C:\Project\BD Evidencija\old_project\src\hooks\"

echo Gotovo! Sve datoteke su vracene na svoja originalna mjesta.
pause
