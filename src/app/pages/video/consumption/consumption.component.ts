import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-consumption',
    templateUrl: './consumption.component.html',
    host: {
        'style': 'display: flex;flex-direction: column;height: 100%;',
    },
})
export class VideoConsumptionLogComponent implements OnInit {
    collection: any = {};

    constructor() { }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
    }

}
