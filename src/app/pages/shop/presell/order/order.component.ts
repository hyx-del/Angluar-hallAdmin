import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-shop-presell-order',
    templateUrl: './order.component.html',
    host: {
        'style': 'display: flex;flex-direction: column;height: 100%;',
    },
})
export class PresellOrderComponent implements OnInit {
    public buttons: any[] = [
        {
            label: '导出',
            display: true,
            click: () => this.collection.export('预售订单')
        },
    ];

    collection: any = {};

    constructor() { }

    ngOnInit() {
    }

    setCollection(collection) {
        this.collection = collection;
    }
}
