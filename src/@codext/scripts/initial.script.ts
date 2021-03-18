export class InitialScript {
  static script = `
    @echo off
    echo.
    echo #######################################
    echo Check Admin Permissions
    echo #######################################
    echo.
    net session >nul 2>&1
    if %errorLevel% == 0 (
        echo Success: Administrative permissions confirmed.
    ) else (
        echo Failure: Current permissions inadequate.
    )


    timeout /t 2
    echo.
    echo.

  `;
}
