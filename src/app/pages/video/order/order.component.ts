import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-order',
    templateUrl: './order.component.html',
    styleUrls: ['./order.component.scss']
})
export class VideoOrderComponent implements OnInit {

    collection: any = {};
    constructor() { }

    ngOnInit() {
    }

    setCollection(collection) {
        this.collection = collection;
    }
}
