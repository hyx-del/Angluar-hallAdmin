import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-dian-ping',
    templateUrl: './dian-ping.html',
    styleUrls: ['./dian-ping.scss']
})
export class DianPingComponent implements OnInit {
    public collection:any = {};

    constructor() { }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
    }

}
