export class TestScript {
  // Load Admin Script Before
  static script = `
  echo Administrative permissions required. Detecting permissions...

  net session >nul 2>&1
  if %errorLevel% == 0 (
      echo Success: Administrative permissions confirmed.
  ) else (
      echo Failure: Current permissions inadequate.
  )
  echo Tesrer > C:\\Users\\Daniel\\Desktop\\neuer.txt
  timeout /t 10
    `;
}
