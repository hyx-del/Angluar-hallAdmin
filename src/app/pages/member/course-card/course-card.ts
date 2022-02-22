import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-course-card',
    templateUrl: './course-card.html',
    styleUrls: ['./course-card.scss']
})
export class MemberCourseCardComponent implements OnInit {
    collection: any = {};
    isVisible: boolean = false;
    detail: any = {courseCard: {}};
    
    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private activeRoute: ActivatedRoute,
    ) {
        this.activeRoute.queryParams.subscribe(params => {
            if (params && params.id) {
                this.showDetail({ id: params.id })
            }
        })
    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.showDetail(item);
        this.collection.onSetHeader = () => {
            this.collection.getHeader('course_card_name').click = (item) => this.showDetail(item);
        }
    }

    showDetail(item: any) {
        item.courseCard = {};
        this.detail = Object.assign({}, item);
        this.isVisible = true;
        // this.http.get("hall/member/admin/member-course-card/detail", { id: item.id }).then(ret => {
        //     console.log("详情", ret);
        // })
    }

    closeCard(item: any) {
        let ids = [item.id];
        this.modalService.confirm({
            nzTitle: "确认要关闭此会员卡？",
            nzOnOk: () => {
                this.http.post("hall/member/admin/member-course-card/close", { id: ids }).then(() => {
                    this.notification.success("提示信息", "关闭课程卡成功");
                    this.collection.load();
                })
            }
        })
    }
}
