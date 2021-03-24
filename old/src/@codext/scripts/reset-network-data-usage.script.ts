export class ResetNetworkDataUsageScript {
  static script = `
  :: ----------------------------------------------------------
  :: -------------Clear (Reset) Network Data Usage-------------
  :: ----------------------------------------------------------
  echo --- Clear (Reset) Network Data Usage
  setlocal EnableDelayedExpansion
      SET /A dps_service_running=0
      SC queryex "DPS"|Find "STATE"|Find /v "RUNNING">Nul||(
          SET /A dps_service_running=1
          net stop DPS
      )
      del /F /S /Q /A "%windir%\System32\sru*"
      IF !dps_service_running! == 1 (
          net start DPS
      )
  endlocal
  :: ----------------------------------------------------------
  `;
}
