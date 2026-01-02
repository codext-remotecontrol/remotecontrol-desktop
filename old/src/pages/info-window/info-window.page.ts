import { AppService } from './../../app/core/services/app.service';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-info-window',
    templateUrl: './info-window.page.html',
    styleUrls: ['./info-window.page.scss'],
})
export class InfoWindowPage implements OnInit {
    constructor(private appService: AppService) {}

    ngOnInit() {
        this.appService.sideMenu = false;
        this.appService.actionBar = false;
    }
}
