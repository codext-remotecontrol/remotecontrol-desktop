import { TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import 'webrtc-adapter';
import { ElectronService } from '../../app/core/services';

import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DialogData {
  pw: string;
  newPw: string;
}
@Component({
  selector: 'set-pw',
  template: `
    <div mat-dialog-content>
      <mat-form-field
        [class.is-invalid]="!newPasswordCheck.correct"
        [class.is-valid]="newPasswordCheck.correct"
      >
        <mat-label>{{ 'Password' | translate }}</mat-label>
        <input matInput [(ngModel)]="data.pw" type="password" />
      </mat-form-field>
      <mat-form-field
        [class.is-invalid]="!newPasswordCheck.correct"
        [class.is-valid]="newPasswordCheck.correct"
      >
        <mat-label>{{ 'Repeat Password' | translate }}</mat-label>
        <input matInput [(ngModel)]="data.newPw" type="password" />
      </mat-form-field>
      <app-password-check
        [password]="data.pw"
        #newPasswordCheck
      ></app-password-check>
    </div>
    <div
      mat-dialog-actions
      style="
    flex-wrap: nowrap;"
    >
      <button mat-button (click)="cancel()">{{ 'Cancel' | translate }}</button>
      <button mat-button cdkFocusInitial (click)="save()">
        {{ 'Save' | translate }}
      </button>
    </div>
  `,
})
export class SetPwDialog {
  constructor(
    public dialogRef: MatDialogRef<SetPwDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private _snackBar: MatSnackBar,
    private translateService: TranslateService
  ) {}

  save() {
    if (this.data.pw == this.data.newPw) {
      this.dialogRef.close(this.data);
    } else {
      this._snackBar.open(
        this.translateService.instant('Password does not match'),
        null,
        {
          duration: 2000,
        }
      );
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  compName = '';
  autoStartEnabled = false;
  autoLaunch;

  hiddenAccess = false;

  settings = {
    hiddenAccess: false,
    randomId: false,
    passwordHash: '',
  };

  constructor(
    private electronService: ElectronService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) {}
  async ngOnInit() {
    const settings = await this.electronService.settings.get('settings');
    console.log(settings);
    Object.assign(this.settings, settings);
    this.compName = this.electronService.os.hostname();
    this.autoLaunch = new this.electronService.autoLaunch({
      name: 'Remotecontrol - Desktop',
      path: this.electronService.remote.app.getPath('exe'),
      isHidden: true,
    });
    const isEnabled = await this.autoLaunch.isEnabled();
    this.autoStartEnabled = isEnabled;
    this.cdr.detectChanges();
  }

  async changeHiddenAccess() {
    await this.saveSettings({
      hiddenAccess: this.settings.hiddenAccess,
    });
  }

  async randomIdChange() {
    await this.saveSettings({
      randomId: this.settings.randomId,
    });
  }

  addPw() {
    const dialogRef = this.dialog.open(SetPwDialog, {
      width: '250px',
      data: {
        pw: '',
        newPw: '',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed', result);
      if (result?.pw) {
        this.setPwHash(result.pw);
      }
    });
  }

  async setPwHash(pw) {
    const hash = await this.electronService.bcrypt.hash(pw, 5);

    await this.saveSettings({
      passwordHash: hash,
    });
  }

  async saveSettings(settings) {
    Object.assign(this.settings, settings);
    console.log(this.settings);
    await this.electronService.settings.set('settings', this.settings);
  }

  changeAutoStart() {
    this.autoLaunch.isEnabled().then((isEnabled) => {
      if (isEnabled) {
        this.autoLaunch.disable();
      } else {
        this.autoLaunch.enable();
      }
    });
  }
}
