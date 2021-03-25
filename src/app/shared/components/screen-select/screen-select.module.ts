import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";
import { ScreenSelectComponent } from "./screen-select.component";

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [ScreenSelectComponent],
})
export class ScreenSelectModule {}
