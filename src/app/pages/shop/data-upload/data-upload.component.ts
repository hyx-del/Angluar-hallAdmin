import { NzNotificationService } from 'ng-zorro-antd';
import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-data-upload',
    templateUrl: './data-upload.component.html',
    styleUrls: ['./data-upload.component.scss']
})
export class DataUploadComponent implements OnInit {
    isVisible: boolean = false;
    selectedIndex: number = 0;

    pageSize: number = 20;

    // 上传中
    isLoadingData: boolean = false;

    orderList: any[] = [];
    isLoading: boolean = false;
    pushTotal: number = 0;
    pushPageIndex: number = 1;

    faildOrderList: any[] = [];
    isFaildLoading: boolean = false;
    pushFaildTotal: number = 0;
    pushFaildPageIndex: number = 1;


    constructor(
        private http: Http,
        private notification: NzNotificationService,
    ) { }

    ngOnInit() {
        this.getDataList(-1);
    }

    tabChange() {
        console.log(this.selectedIndex);
        if (this.selectedIndex == 1 && !this.isLoadingData) {
            this.isLoadingData = true;
            this.getDataList(1);
        }
    }

    // 1 -> 上传中 -1 -> 上传失败,
    getDataList(queue_status: 1 | -1 = -1) {
        let params = {
            size: this.pageSize,
            page: queue_status == 1 ? this.pushPageIndex : this.pushFaildPageIndex,
            queue_status: queue_status,
        };

        this.http.post("hall/admin-hall/business-order/failed-push-list", params).then(ret => {
            (ret.data || []).forEach(item => {
                if (item.exception && item.exception.length > 100) {
                    item.shortException = item.exception.substring(0, 100);
                }
                if (item.payload && item.payload.length > 40) {
                    item.shortPayload = item.payload.substring(0, 40);
                }
            });
            // if (ret.data.length < 50) {
            //     for (let index = 0; index < 50; index++) {
            //         ret.data.push(ret.data[0]);                    
            //     }
            // }

            if (queue_status == 1) {
                this.pushPageIndex = ret.current_page || 1;
                this.pushTotal = ret.total || 0;
                this.orderList = ret.data || [];
                this.isLoading = false;
            } else {
                this.pushFaildPageIndex = ret.current_page || 1;
                this.pushFaildTotal = ret.total || 0;
                this.faildOrderList = ret.data || [];
                this.isFaildLoading = false;
            }
        })
    }

    faildPageIndexChange() {
        this.getDataList(-1);
    }
    refreshFaildOrder() {
        this.isFaildLoading = true;
        this.getDataList(-1);
    }

    pageIndexChange() {
        this.getDataList(1);
    }
    refresh() {
        this.isLoading = true;
        this.getDataList(1);
    }


    retryPushOrder(data: any) {
        // 上传失败 为-1
        let queue_status: 1 | -1 = this.selectedIndex == 1 ? 1 : -1;

        this.http.post("hall/admin-hall/business-order/retry-push-order", { id: data.id }).then(ret => {
            this.notification.success("提示信息", "重新上传成功");
            this.getDataList(queue_status);
        });
    }

    currentData: any = {};
    previewException(data) {
        this.currentData = Object.assign({}, data);
        this.isVisible = true;
    }

    showDetail(data) {
        this.currentData = Object.assign({}, data);
        this.isVisible = true;
    }

    closeModal() {
        this.isVisible = false;
    }


    // 订单上传记录
    collection: any = {};
    setCollection(collection) {
        this.collection = collection;
    }
}
