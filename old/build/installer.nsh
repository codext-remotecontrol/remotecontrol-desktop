!include LogicLib.nsh

!macro customInit
  Var /GLOBAL VCRedistDownload

  ${If} ${RunningX64}
    ;HKCR\Installer\Dependencies\VC,redist.x64,amd64,14.21,bundle\Dependents\{f4220b74-9edd-4ded-bc8b-0342c1e164d8}
    ;HKCR\Installer\Dependencies\VC,redist.x64,amd64,14.22,bundle\Dependents\{6361b579-2795-4886-b2a8-53d5239b6452}
    ;HKCR\Installer\Dependencies\VC,redist.x64,amd64,14.23,bundle\Dependents\{852adda4-4c78-4a38-b583-c0b360a329d6}
    ;HKCR\Installer\Dependencies\VC,redist.x64,amd64,14.24,bundle\Dependents\{282975d8-55fe-4991-bbbb-06a72581ce58}
    ;HKCR\Installer\Dependencies\VC,redist.x64,amd64,14.25,bundle\Dependents\{6913e92a-b64e-41c9-a5e6-cef39207fe89}

    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x64,amd64,14.21,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x64,amd64,14.22,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x64,amd64,14.23,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x64,amd64,14.24,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x64,amd64,14.25,bundle" "Version"
    IfErrors 0 VSRedistInstalled

    MessageBox MB_YESNO "This application requires$\r$\n\
      'Microsoft Visual C++ Redistributable for Visual Studio 2015 - 2019 x64'$\r$\n\
      to function properly.$\r$\n$\r$\n\
      Download and install now?" /SD IDYES IDNO VSRedistInstalled
    StrCpy $VCRedistDownload "https://aka.ms/vs/16/release/vc_redist.x64.exe"
  ${Else}
    ;HKCR\Installer\Dependencies\VC,redist.x86,x86,14.21,bundle\Dependents\{49697869-be8e-427d-81a0-c334d1d14950}
    ;HKCR\Installer\Dependencies\VC,redist.x86,x86,14.22,bundle\Dependents\{5bfc1380-fd35-4b85-9715-7351535d077e}
    ;HKCR\Installer\Dependencies\VC,redist.x86,x86,14.23,bundle\Dependents\{45231ab4-69fd-486a-859d-7a59fcd11013}
    ;HKCR\Installer\Dependencies\VC,redist.x86,x86,14.24,bundle\Dependents\{e31cb1a4-76b5-46a5-a084-3fa419e82201}
    ;HKCR\Installer\Dependencies\VC,redist.x86,x86,14.25,bundle\Dependents\{65e650ff-30be-469d-b63a-418d71ea1765}

    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x86,x86,14.21,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x86,x86,14.22,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x86,x86,14.23,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x86,x86,14.24,bundle" "Version"
    IfErrors 0 VSRedistInstalled
    ReadRegStr $R0 HKCR "Installer\Dependencies\VC,redist.x86,x86,14.25,bundle" "Version"
    IfErrors 0 VSRedistInstalled

    MessageBox MB_YESNO "This application requires$\r$\n\
      'Microsoft Visual C++ Redistributable for Visual Studio 2015 - 2019 x86'$\r$\n\
      to function properly.$\r$\n$\r$\n\
      Download and install now?" /SD IDYES IDNO VSRedistInstalled
    StrCpy $VCRedistDownload "https://aka.ms/vs/16/release/vc_redist.x86.exe"
  ${EndIf}

  ;if no goto executed, install vcredist
  ;create temp dir
  CreateDirectory $TEMP\app-name-setup
  ;download installer
  NSISdl::download "$VCRedistDownload" $TEMP\app-name-setup\vcppredist.exe
  ;exec installer
  ExecWait "$TEMP\app-name-setup\vcppredist.exe"

  VSRedistInstalled:
  ;nothing to do here
!macroend
