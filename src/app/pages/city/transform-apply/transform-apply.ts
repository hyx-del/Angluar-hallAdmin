import { Component, OnInit } from '@angular/core';
import { HallService, FileService } from '@/providers/index';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';

@Component({
    selector: 'app-transform-apply',
    templateUrl: './transform-apply.html',
    styleUrls: ['./transform-apply.scss']
})
export class TransformApplyComponent implements OnInit {
    collection: any = {};

    currentCity: any = {};
    isVisible: boolean = false;
    detail: any = {};
    ossPath: string = "";
    imageList: any[] = [];
    previewVisible: boolean = false;
    previewImage: string = '';

    constructor(
        private hallService: HallService,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private http: Http,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.currentCity = this.hallService.getCurrentCity();
    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => {
        //     this.getDetail(item.id);
        // }
        this.collection.onSetHeader = () => {
            this.collection.getHeader('member_name').click = (item) => this.getDetail(item.id);
        }
    }

    getDetail(id: number) {
        this.detail = {};
        this.http.get("hall/member/admin-city/member-course-card/transform-check/detail", { id: id }).then(ret => {

            if (ret.to_commission) {
                ret.hasCommission = !!parseFloat(ret.to_commission);
            }
            this.detail = ret;
            this.imageList = ret.appendixes || [];
            this.isVisible = true;
        })
    }

    confirmCheck() {
        this.agreed(this.detail);
    }

    cancelCheck() {
        this.reject(this.detail);
    }

    agreed(item) {
        let params: any = {
            city_id: this.currentCity.id,
            id: item.id 
        }
        this.modalService.confirm({
            nzTitle: "确定同意转卡？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card/transform-check/agree", params).then(ret => {
                    this.notification.success("提示信息", "操作成功");
                    this.collection.load();
                })
            }
        })
    }

    reject(item) {
        let params: any = {
            city_id: this.currentCity.id,
            id: item.id 
        }
        this.modalService.confirm({
            nzTitle: "确定不同意转卡？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card/transform-check/disagree", params).then(ret => {
                    this.notification.success("提示信息", "操作成功");
                    this.collection.load();
                })
            }
        })
    }

    checkCancel(item) {
        this.modalService.confirm({
            nzTitle: "确定审核作废？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card/transform-check/cancel", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "审核作废成功");
                    this.collection.load();
                })
            }
        })
    }

    handlePreview(imageUrl) {
        this.previewImage = this.ossPath + imageUrl;
        this.previewVisible = true;
    }

    hideModal() {
        this.isVisible = false;
    }

}
