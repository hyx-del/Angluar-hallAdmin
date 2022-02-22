import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-score-statistice',
    templateUrl: './score-statistice.component.html',
    styleUrls: ['./score-statistice.component.scss']
})
export class ScoreStatisticeComponent implements OnInit {
    collection: any = {
        data: [],
    };
    isLoading: boolean = false;

    dataList: any = [];
    buttons: any[] = [
        { label: '导出', display: true, click: () => this.export() },
    ]

    constructor(
        private http: Http,
    ) {

    }

    ngOnInit() {
    }
    
    setCollection(collection) {
        this.collection = collection;
        this.collection.onLoad = () => {
            this.isLoading = true;
        }
        this.collection.onLoaded = () => {
            this.isLoading = false;
        }
    }

    export() {
        this.collection.export("教练评分统计", 'all');
    }
}
