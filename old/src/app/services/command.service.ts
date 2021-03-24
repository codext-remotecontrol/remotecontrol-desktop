import { ElectronService } from './electron.service';
import { Injectable } from '@angular/core';
import * as path from 'path';
import * as os from 'os';

import * as powershell from 'node-powershell';
import Sudoer from 'electron-sudo';

@Injectable({ providedIn: 'root' })
export class CommandService {
  constructor(private electron: ElectronService) {}

  batch(script) {
    return new Promise((resolve, reject) => {
      const spawn = this.electron.childProcess.spawn;
      const fs = this.electron.fs;
      const scriptDir = path.join(os.tmpdir(), 'windows10-tweak-script.bat');

      try {
        fs.writeFileSync(scriptDir, script, 'utf-8');

        const ps = new powershell({
          executionPolicy: 'Bypass',
          noProfile: true,
        });

        ps.addCommand(
          `Start-Process cmd -ArgumentList '/c ${scriptDir}' -Verb runas -Wait`
        );
        ps.invoke()
          .then((output) => {
            console.log(output);
            resolve(output);
          })
          .catch((err) => {
            console.log(err);
            reject(err);
          });
      } catch (e) {
        reject(e);
      }
    });
  }
}
