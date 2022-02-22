import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny'
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
@Component({
  selector: 'app-price-adjust',
  templateUrl: './price-adjust.component.html',
  styleUrls: ['./price-adjust.component.scss']
})
export class PriceAdjustComponent implements OnInit {

  constructor(
    private http: Http,
    private notification: NzNotificationService,
    private nzModalService: NzModalService
  ) { }

  ngOnInit() {
  }

  public collection: any = {};


  public setCollection(collection) {
    this.collection = collection;
  }

  public pass(data) {
    this.nzModalService.confirm({
      nzTitle: '确定通过审核?',
      nzOnOk: async () => {
        await this.http.post('hall/member/admin/member-course-card/unit-price-change/agree', { change_log_id: data.id });
        this.notification.success('提示信息', '审核成功!');
        this.collection.load();
      }
    })
  }

  public reject(data) {
    this.nzModalService.confirm({
      nzTitle: '确定驳回?',
      nzOnOk: async () => {
        await this.http.post('hall/member/admin/member-course-card/unit-price-change/reject', { change_log_id: data.id });
        this.notification.success('提示信息', '驳回成功!');
        this.collection.load();
      }
    })
  }

}
