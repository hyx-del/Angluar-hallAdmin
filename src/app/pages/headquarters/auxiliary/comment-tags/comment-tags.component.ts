import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';


@Component({
    selector: 'app-comment-tags',
    templateUrl: './comment-tags.component.html',
    styleUrls: ['./comment-tags.component.scss']
})
export class CommentTagsComponent implements OnInit {


    form: nyForm;
    isVisible: boolean = false;

    tag: any = {};
    tagsList: any[] = [];

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {
        this.getTagsList();
    }

    getTagsList() {
        this.http.get("hall/admin/comment-tag/list").then(data => {
            this.tagsList = data || [];
        })
    }

    showModal() {
        this.tag = {};
        this.isVisible = true;
    }

    edit(data: any) {
        this.tag = { ...data };
        this.form.body = { ...data };
        this.isVisible = true;
    }

    onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ['id'];
    }

    confirm() {
        if (this.tag.id) {
            this.form.action = "hall/admin/comment-tag/update";
        } else {
            this.form.action = "hall/admin/comment-tag/create";
        }

        this.form.submit().then(() => {
            if (this.tag.id) {
                this.notification.success("提示信息", "修改成功");
            } else {
                this.notification.success("提示信息", "新建成功");
            }
            this.getTagsList();
            this.closeModal();
        })

    }

    enableTags(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要启用该评价标签吗?",
            nzOnOk: () => {
                this.http.post("hall/admin/comment-tag/enable", { id: data.id, status: 1 }).then(() => {
                    this.notification.success("提示信息", "启用成功");
                    this.getTagsList();
                })
            }
        })
    }

    disabledTags(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要禁用该评价标签吗?",
            nzOnOk: () => {
                this.http.post("hall/admin/comment-tag/enable", { id: data.id, status: 0 }).then(() => {
                    this.notification.success("提示信息", "禁用成功");
                    this.getTagsList();
                })
            }
        })
    }

    closeModal() {
        this.isVisible = false;
        this.form.clearError();
        this.form.body = {};
        this.tag = {};
    }

}
