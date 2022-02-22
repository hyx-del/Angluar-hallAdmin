import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { FileService } from '@/providers/services/file-service';
import { Config } from '@/config';

@Component({
    selector: 'app-coach',
    templateUrl: './coach.component.html',
    styleUrls: ['./coach.component.scss']
})
export class VideoCoachComponent implements OnInit {
    collection: any = {};
    isVisible: boolean;
    detail: any = {};
    ossPath: string = "";

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            collection.getHeader('mobile').click = (item) => this.showDetail(item);
        }
    }

    showDetail(data: any) {
        this.http.get("mix/video/admin/coach/detail", { id: data.id }).then(data => {
            this.detail = { ...data };
            this.isVisible = true;
        })
    }

    save() {
        let params = {
            id: this.detail.id,
            priority: this.detail.priority,
        }
        this.http.post("mix/video/admin/coach/priority-update", params).then(() => {
            this.notificationService.success("提示信息", "修改成功");
            this.closeModal();
            this.collection.load();
        })
    }

    closeModal() {
        this.isVisible = false;
        this.detail = {};
    }

    showCoach(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要显示这个教练吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/coach/show", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "显示成功");
                    this.collection.load();
                })
            }
        })
    }

    hideCoach(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要隐藏这个教练吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/coach/hide", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "隐藏成功");
                    this.collection.load();
                })
            }
        })
    }

}
