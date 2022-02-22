import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-course-comments',
    templateUrl: './course-comments.html',
    styleUrls: ['./course-comments.scss']
})
export class CourseCommentsComponent implements OnInit {
    collection: any = {};
    isVisible: boolean = false;
    commentDetail: any = {};
    message: string = "";

    buttons: any[] = [
        { label: '导出', display: true, click: () => this.export() },
    ]

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
    }

    getCommentDetail(data: any) {
        this.http.get("hall/admin-city/comment/detail", { id: data.id }).then(ret => {
            if (!ret.comment_tags) {
                ret.comment_tags = [];
            }
            this.commentDetail = { ...ret };
            this.isVisible = true;
        })
    }

    replyComment() {
        if (!this.message) {
            this.notification.info("提示信息", "请输入回复内容");
            return ;
        }
        let params = {
            id: this.commentDetail.id,
            reply_content: this.message,
        }
        this.http.post("hall/admin-city/comment/reply", params).then(() => {
            this.notification.success("提示信息", "回复成功")
            this.collection.load();
            this.closeModal();
        })
    }

    closeModal() {
        this.isVisible = false;
        this.commentDetail = {};
        this.message = "";
    }

    export() {
        let newHeader = [...this.collection.headers];
        newHeader.unshift(
            {label: '评价会员', value: 'member_name'},
            {label: '会员手机号', value: 'member_contact'},
            {label: '教练手机号', value: 'coach_mobile'},
        );

        this.collection.export("上课评价", "all", newHeader);
    }
}
