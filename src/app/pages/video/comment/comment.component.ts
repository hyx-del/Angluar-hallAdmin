import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

@Component({
    selector: 'app-comment',
    templateUrl: './comment.component.html',
    styleUrls: ['./comment.component.scss']
})
export class VideoCommentComponent implements OnInit {

    collection: any = {};
    isVisible: boolean;

    comment: any = {};
    message: string = "";

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {
    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            collection.getHeader('member_mobile').click = (item) => this.showDetail(item);
        }
    }

    showDetail(data: any) {
        // this.isVisible
        // 
        this.http.get("mix/video/admin/comment/detail", { id: data.id }).then(data => {
            if (data.replies && !Array.isArray(data.replies)) {
                data.replies = [data.replies];
            }
            this.comment = { ...data }
            console.log("comment", this.comment);
            this.isVisible = true;
        })
    }

    submit() {
        if (!this.message) {
            return;
        }
        let params = {
            id: this.comment.id,
            content: this.message
        }
        this.http.post("mix/video/admin/comment/reply", params).then(ret => {
            this.notificationService.success("提示信息", "回复成功");
            this.collection.load();
            this.hideModal();
        })
    }

    hideModal() {
        this.isVisible = false;
        this.comment = {};
        this.message = "";
    }

    showComment(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要显示这条评论吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/comment/show", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "显示成功");
                    this.collection.load();
                })
            }
        })
    }

    hideComment(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要隐藏这条评论吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/comment/hide", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "隐藏成功");
                    this.collection.load();
                })
            }
        })
    }
}
