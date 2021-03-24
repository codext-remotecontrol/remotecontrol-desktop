export class ClearRecentlyAccessdFilesScript {
  static script = `
  :: ----------------------------------------------------------
  :: --------------Clear recently accessed files---------------
  :: ----------------------------------------------------------
  echo --- Clear recently accessed files
  del /f /q "%APPDATA%\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\*"
  :: ----------------------------------------------------------
  `;
}
