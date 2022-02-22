import { Http } from '@yilu-tech/ny';
import { Component, OnInit } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-course-card',
    templateUrl: './course-card.html',
    styleUrls: ['./course-card.scss']
})
export class CourseCardComponent implements OnInit {
    collection: any = {};

    public buttons: any[] = [
        // { name: 'create', label: "新增课程卡", click: () => this.showModal() },
    ];

    urls: any = {
        list: "hall/course/admin-hall/course-card/list",
        detail: "hall/course/admin-hall/course-card/detail",
    }
    detailVisible: boolean = false;

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private activatedRoute: ActivatedRoute,
    ) {
        this.activatedRoute.queryParams.subscribe(params => {
            if (params && params.id) {
                this.edit({ id: params.id });
            }
        })
    }

    ngOnInit() {
        
    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.edit(item);
        
        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    detail: any = {};
    edit(item) {
        this.http.get(this.urls.detail, { id: item.id }).then(ret => {
            this.detail = ret;
            this.showCardDetail();
        })
    }

    showCardDetail(item?: any) {
        this.detailVisible = true;
        // if (!this.hallList.length) {
        //     this.getHallList();
        // }
        // this.getCardSetting();
    }
}
