import { Component, OnInit } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';

import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/services/hall.service';
import { ruleType } from '../sales-commission-rule/sales-commission-rule';

@Component({
    selector: 'app-shop-commission',
    templateUrl: './shop-commission.html',
    styleUrls: ['./shop-commission.scss']
})
export class SalesShopCommissionComponent implements OnInit {

    shopList: any[] = [];
    currentShop: any = {};
    // 销售规则
    rulesList: any[] = [];
    // 店长规则
    shopRulesList: any[] = [];

    isLoadingRules: boolean = false;

    ruleId = null;
    shopRuleId = null;
    shopRuleMap: any= {};
    shopManageRuleMap: any= {};

    ruleType = ruleType;

    constructor(
        private hallService: HallService,
        private http: Http,
        private notificationService: NzNotificationService,
    ) { }

    ngOnInit() {
        this.shopList = this.hallService.getCityHalls();
        if (this.shopList.length) {
            this.currentShop = this.shopList[0];
            this.getShopRules(this.currentShop.id);
        } else {
            this.getCityShops();
        }
        this.getRulesDetail();
    }

    getCityShops() {
        this.http.get("hall/admin-city/hall-list").then(ret => {
            this.shopList = ret.halls || [];
            if (this.shopList.length) {
                this.currentShop = this.shopList[0];
                this.getShopRules(this.currentShop.id);
            }
        })
    }

    getShopRules(hall_id) {
        if (this.isLoadingRules && !this.rulesList.length) return ;
        if (this.shopRuleMap[hall_id] && this.shopManageRuleMap[hall_id]) {
            this.ruleId = this.shopRuleMap[hall_id];
            this.shopRuleId = this.shopManageRuleMap[hall_id];
        } else {
            this.http.get("hall/admin-city/sales-commission-rule/hall-detail", { hall_id: hall_id }).then(ret => {
                (ret || []).forEach(item => {
                    if (item.type == ruleType.default) {
                        this.ruleId = item.rule_id;
                        this.shopRuleMap[hall_id] = item.rule_id;
                    } 
                    if (item.type == ruleType.shop) {
                        this.shopRuleId = item.rule_id;
                        this.shopManageRuleMap[hall_id] = item.rule_id;
                    }
                });
            })
        }
    }

    getRulesDetail() {
        this.http.get("hall/admin-city/sales-commission-rule/detail").then(data => {
            data.forEach(item => {
                if (item.commission_rule && item.commission_rule.length) {
                    item.commission_rule.forEach(rule => {
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
                    });
                }
            });
            let saleRuleList = (data || []).filter(item => item.type == ruleType.default);
            let shopRuleList = (data || []).filter(item => item.type == ruleType.shop);
            
            this.rulesList = saleRuleList;
            this.shopRulesList = shopRuleList;

            this.isLoadingRules = true;
        })
    }

    saveSetting(type: number) {
        let params: any = {
            hall_id: this.currentShop.id,
            type: type,
        }

        if (type == ruleType.default) {
            params.rule_id = this.ruleId;
        } else if (type == ruleType.shop) {
            params.rule_id = this.shopRuleId;
        }

        if (!params.rule_id) {
            this.notificationService.info("提示信息", "请选择规则");
            return ;
        }
        this.http.post("hall/admin-city/sales-commission-rule/set-hall-rule?hall_id=" + this.currentShop.id, params).then(() => {
            this.notificationService.success("提示信息", "保存成功");
            if (type == ruleType.default) {
                this.shopRuleMap[params.hall_id] = params.rule_id;
            } else if (type == ruleType.shop) {
                this.shopManageRuleMap[params.hall_id] = params.rule_id;
            }
        })

    }

    tapHandle(index: number) {
        this.currentShop = this.shopList[index];
        this.ruleId = null;
        this.shopRuleId = null;
        this.getShopRules(this.currentShop.id);
    }
}
