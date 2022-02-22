import { Component, OnInit } from '@angular/core';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { FileService } from '@/providers/index';
import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';

@Component({
  selector: 'app-recede-apply',
  templateUrl: './recede-apply.component.html',
  styleUrls: ['./recede-apply.component.scss']
})
export class RecedeApplyComponent implements OnInit {
  collection: any = {};
  retreatCardVisible = false;
  retreatCardParams: any = {};
  ossPath: string = "";

  constructor(
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
  }
  setCollection(collection) {
    this.collection = collection;
    this.collection.onSetHeader = () => {
      this.collection.getHeader('member_name').click = (item) => this.getDetail(item.id);
    }
  }

  async getDetail(id: Number) {
    const res = await this.http.get('hall/member/admin-city/member-course-card/refund/detail', { order_id: id });
    this.retreatCardVisible = true;
    if (res) {
      this.retreatCardParams = res;
    }
    console.log("res==========>", res)
  }

  cancelRetreatCard() {
    this.retreatCardVisible = false;
  }

  agreed(item) {
    this.modalService.confirm({
      nzTitle: '确定同意退卡？',
      nzOnOk: async () => {
        const res = await this.http.post('hall/member/admin-city/member-course-card/refund/approve', { order_id: item.id });
        console.log(res)
        if (res == 'success') {
          this.notification.success("提示信息", "操作成功");
          this.collection.load();
        }
      }
    })
  }
  reject(item) {
    this.modalService.confirm({
      nzTitle: '确定不同意退卡？',
      nzOnOk: async () => {
        const res = await this.http.post('hall/member/admin-city/member-course-card/refund/reject', { order_id: item.id });
        this.notification.success("提示信息", "操作成功");
        this.collection.load();
      }
    })
  }
  checkCancel(item) {
    this.modalService.confirm({
      nzTitle: '确定审核作废？',
      nzOnOk: async () => {
        const res = await this.http.post('hall/member/admin-city/member-course-card/refund/cancel-check', { order_id: item.id });
        this.notification.success("提示信息", "操作成功");
        this.collection.load();
      }
    })
  }
}
