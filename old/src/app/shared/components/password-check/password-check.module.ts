import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PasswordCheckComponent } from './password-check.component';

@NgModule({
    imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
    declarations: [PasswordCheckComponent],
    exports: [PasswordCheckComponent],
})
export class PasswordCheckModule {}
