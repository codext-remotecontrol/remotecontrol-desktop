import { Component } from "@angular/core";
import { ElectronService } from "./core/services";
import { TranslateService } from "@ngx-translate/core";
import { AppConfig } from "../environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  public appPages = [
    { title: "Inbox", url: "/folder/Inbox", icon: "mail" },
    { title: "Outbox", url: "/folder/Outbox", icon: "paper-plane" },
    { title: "Favorites", url: "/folder/Favorites", icon: "heart" },
    { title: "Archived", url: "/folder/Archived", icon: "archive" },
    { title: "Trash", url: "/folder/Trash", icon: "trash" },
    { title: "Spam", url: "/folder/Spam", icon: "warning" },
  ];
  public labels = ["Family", "Friends", "Notes", "Work", "Travel", "Reminders"];

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang("en");
    console.log("AppConfig", AppConfig);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log("Run in electron");
      console.log("Electron ipcRenderer", this.electronService.ipcRenderer);
      console.log("NodeJS childProcess", this.electronService.childProcess);
    } else {
      console.log("Run in browser");
    }
  }
}
