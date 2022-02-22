import { NzNotificationService } from 'ng-zorro-antd';
import { Component, OnInit } from '@angular/core';

import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-shop-manage',
    templateUrl: './shop-manage.html',
    styleUrls: ['./shop-manage.scss']
})
export class ShopManageComponent implements OnInit {

    shopManageList: any[] = [];
    shopManageId: number = null;
    rulesList: any[] = [];
    textMap: any = {
        1: "销售提成规则",
        2: "店长提成规则",
        3: "店长团队提成规则",
    }

    isLoading: boolean = false;

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
    ) { }

    ngOnInit() {
        this.http.get("hall/admin-hall/sales-commission-rule/detail").then(data => {
            (data || []).forEach(item => {
                if (item.rule && item.rule.commission_rule && item.rule.commission_rule.length) {
                    item.rule.commission_rule.forEach((rule) => {
                        if (parseFloat(rule.performance_end) === -1) {
                            rule.checked = true;
                            rule.performance_end = null;
                        }
                        if (rule.commission_rate) {
                            rule.probation =  parseFloat((parseFloat(rule.commission_rate.probation) * 100).toFixed(2));
                            rule.official = parseFloat((parseFloat(rule.commission_rate.official) * 100).toFixed(2));
                        }
                        if (rule.rate) { // 店长 团队
                            rule.rate =  parseFloat((parseFloat(rule.rate) * 100).toFixed(2));
                        }
                    })
                }
            });
            this.rulesList = data;
        })
        this.getShopManageList();
        this.getCommissionShopManage();
    }

    getShopManageList() {
        this.http.get("staff/manage/getManagerList").then(data => {
            this.shopManageList = data || [];
            this.isLoading = true;
            if (this.shopManageId) {
                this.setCurrentShopManage();                
            }
        })
    }

    getCommissionShopManage() {
        this.http.post("hall/admin-hall/sales-commission-rule/get-manager").then(data => {
            if (data) {
                this.shopManageId = data || null;
                if (this.shopManageList.length) {
                    this.setCurrentShopManage();
                }
            }
        })
    }

    setCurrentShopManage() {
        (this.shopManageList || []).forEach(staff => {
            if (staff.id == this.shopManageId) {
                staff._is_manage = true;
            } else {
                staff._is_manage = false;
            }
        });
    }

    save() {
        if (!this.shopManageId) return ;
        let params = {
            salesman_id: this.shopManageId,
        }
        this.http.post("hall/admin-hall/sales-commission-rule/set-manager", params).then(ret => {
            this.notificationService.success("提示信息", "保存成功");
        })  
    }
}
