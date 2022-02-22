import { Component, OnInit, ViewChild } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

@Component({
    selector: 'app-show',
    templateUrl: './show.component.html',
    styleUrls: ['./show.component.scss']
})
export class VideoShowSettingComponent implements OnInit {

    articleList: any[] = [];
    isVisible: Boolean = false;
    params: any = {};
    form: nyForm;

    htmlContent: string = "";

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private modalService: NzModalService
    ) { }


    ngOnInit() {
        this.getList();
    }


    getList() {
        this.http.get("mix/video/admin/about/article/list").then(data => {
            this.articleList = data || [];
        })
    }

    getDetail(data: any) {
        this.http.get("mix/video/admin/about/article/detail", { id: data.id }).then(ret => {
            this.isVisible = true;
            this.params = { ...ret };
            this.htmlContent = ret.content || "";
        })
    }

    onFormInit(form: nyForm) {
        this.form = form;
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        if (this.params.id) {
            this.form.body = { ...this.params };
        }
        this.form.onSubmit = (body) => {
            body.content = this.htmlContent;
        }
    }

    save() {
        if (this.params.id) {
            this.form.action = "mix/video/admin/about/article/update";
        } else {
            this.form.action = "mix/video/admin/about/article/create";
        }
        this.form.submit().then(() => {
            this.notificationService.success("提示信息", this.params.id ? "修改成功" : "添加成功");
            this.isVisible = false;
            this.params = {};
            this.form.body = {};
            this.getList();
        })
    }

    showModal() {
        this.isVisible = true;
    }

    handleCancel() {
        this.isVisible = false;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
        this.htmlContent = "";
    }

    enable(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要启用该内容吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/about/article/enable", { id: data.id, status: 1 }).then(() => {
                    this.notificationService.success("提示信息", "启用成功");
                    this.getList();
                })
            }
        })
    }

    disable(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要禁用该内容吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/about/article/disable", { id: data.id, status: 0 }).then(() => {
                    this.notificationService.success("提示信息", "禁用成功");
                    this.getList();
                })
            }
        })
    }

    remove(data) {
        this.modalService.confirm({
            nzTitle: "确定要删除该内容吗?",
            nzOnOk: () => {
                this.http.delete("mix/video/admin/about/article/delete", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "删除成功");
                    this.getList();
                })
            }
        })
    }


}
