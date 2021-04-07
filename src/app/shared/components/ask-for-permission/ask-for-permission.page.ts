import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ask-for-permission',
  templateUrl: './ask-for-permission.page.html',
  styleUrls: ['./ask-for-permission.page.scss'],
})
export class AskForPermissionPage {
  constructor(public dialogRef: MatDialogRef<AskForPermissionPage>) {}

  accept() {
    this.dialogRef.close(true);
  }

  decline() {
    this.dialogRef.close();
  }
}
