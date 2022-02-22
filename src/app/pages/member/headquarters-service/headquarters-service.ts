import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-headquarters-service',
    templateUrl: './headquarters-service.html',
    styleUrls: ['./headquarters-service.scss']
})
export class HeadquartersServiceComponent implements OnInit {
    public collection:any = {};

    constructor() { }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
    }
}
