import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-consume-statistics',
    templateUrl: './consume-statistics.html',
    styleUrls: ['./consume-statistics.scss']
})
export class MemberConsumeStatisticsComponent implements OnInit {
    isVisible: boolean = false;

    collection: any = {};
    logsCollection: any = {};

    buttons: any[] = [
        { label: '导出', display: true, click: () => this.export() },
    ]

    detailButtons: any[] = [
        { label: '导出', display: true, click: () => this.exportDetail() },
    ]

    detail: any = {};

    constructor() { }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            collection.getHeader('member_name').click = (item) => this.getDetail(item);
        }
    }

    setLogsCollection(collection) {
        this.logsCollection = collection;
    }


    getDetail(data: any) {
        this.detail = Object.assign({}, data);
        this.isVisible = true;
    }


    handleCancel() {
        this.isVisible = false;
    }

    export() {
        this.collection.export("会员消费统计", "all");
    }

    exportDetail() {
        this.logsCollection.export("会员消费记录", "all");
    }
}
