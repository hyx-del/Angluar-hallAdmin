import { Component, OnInit } from '@angular/core';

@Component({
    templateUrl: './test-ny-search-input.component.html',
    styleUrls: ['./test-ny-search-input.component.scss'],
    host: {flex: 'column'}
})
export class TestNySearchInputComponent implements OnInit {

    public url: string;
    
    public collection: any = {};
    public buttons: any[] = [];
    public createUrl: string;

    constructor() { }

    ngOnInit() {
        
    }

    create() {
        if (!this.url) return ;
        this.createUrl = this.url;
    }

    destroy() {
        this.createUrl = null;
    }
    
    // 'inventory/i/admin/shop/purchase/purchase-order/purchase-list';

    public setCollection(collection) {
        this.collection = collection;
        console.log("-----", collection);
        
        this.collection.onLoad = (options) => {

        };
    }
}
