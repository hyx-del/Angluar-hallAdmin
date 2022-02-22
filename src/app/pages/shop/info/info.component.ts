import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { HallService, FileService } from '@/providers/index';
import { Config } from '@/config';

@Component({
    selector: 'app-info',
    templateUrl: './info.component.html',
    styleUrls: ['./info.component.scss']
})
export class HallInfoComponent implements OnInit {

    ossPath: string = "";
    info: any = {};

    constructor(
        private http: Http,
        private hallService: HallService,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getHallInfo();
    }

    getHallInfo() {
        let currentHall = this.hallService.getCurrentHall();
        console.log("currentHall", currentHall);
        this.http.get("hall/admin/detail", { id: currentHall.id }).then(ret => {
            this.info = ret;
        })
    }
}
