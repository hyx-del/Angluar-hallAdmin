import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

import { Export } from '@/providers/utils';

@Component({
    selector: 'app-suggest',
    templateUrl: './suggest.component.html',
    styleUrls: ['./suggest.component.scss']
})
export class SuggestComponent implements OnInit {
    buttons: any[] = [
        { label: '导出', display: true, click: () => this.export() },
    ]

    isVisible: boolean = false;
    collection: any = {};
    detail: any = {};

    message: string = "";

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
        // collection.onSetHeader = () => {
        //     collection.getHeader('name').click = (item) => this.getDetail(item);
        // }
    }

    showModal() {

        this.isVisible = true;
    }

    refresh() {
        this.collection.load();
    }

    getDetail(data: any) {
        this.http.get("hall/admin-hall/suggestion/detail", { id: data.id }).then(ret => {
            this.detail = { ...ret };
            this.isVisible = true;
        })
    }

    replySuggest() {
        if (!this.message) {
            this.notification.info("提示信息", "请输入回复内容");
            return ;
        }
        let params = {
            id: this.detail.id,
            reply_content: this.message,
        }
        this.http.post("hall/admin-hall/suggestion/reply", params).then(ret => {
            this.notification.success("提示信息", "回复成功");
            this.collection.load();
            this.closeModal();
        })
    }


    closeModal() {
        this.isVisible = false;
        this.detail = {};
        this.message = "";
    }

    export() {
        this.collection.export("投诉建议", "all");
    }
}
