import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

import { Http } from '@yilu-tech/ny';

export enum ruleType {
    default = 1, // 普通销售
    shop, // 店长
    team, // 团队
}

@Component({
    selector: 'app-sales-commission-rule',
    templateUrl: './sales-commission-rule.html',
    styleUrls: ['./sales-commission-rule.scss']
})
export class SalesCommissionRuleComponent implements OnInit {

    rules: any[] = [];
    isVisible: boolean = false;
    isShopVisible: boolean = false;

    params: any = {};

    addRuleType: ruleType = 1;

    dataList: any[] = [];
    ruleType = ruleType;

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {
        this.getRulesDetail();
    }

    showModal(type: number) {
        this.params = {};
        this.rules.push({});
        this.isVisible = true;
        this.addRuleType = type;
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
            let teamRuleList = (data || []).filter(item => item.type == ruleType.team);

            let dataList: any = [];
            dataList.push({
                type: ruleType.default,
                list: saleRuleList,
            })
            dataList.push({
                type: ruleType.shop,
                list: shopRuleList,
            })
            dataList.push({
                type: ruleType.team,
                list: teamRuleList,
            })
            this.dataList = dataList;
        })
    }

    showDetail(event, data) {
        event.stopPropagation();
        this.rules = data.commission_rule || [];
        this.params = Object.assign({ isDefault: !!data.is_default }, data);
        this.isVisible = true;
        this.addRuleType = data.type;
    }

    remove(event, data) {
        event.stopPropagation();
        this.modalService.confirm({
            nzTitle: `确定删除"${data.name}"规则？`,
            nzOnOk: () => {
                this.http.delete("hall/admin-city/sales-commission-rule/delete", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "删除成功");
                    this.getRulesDetail();
                })
            }
        })
    }

    setDefaultRule(event, data) {
        event.stopPropagation();
        let params = {
            rule_id: data.id,
            type: data.type,
        }
        this.http.post("hall/admin-city/sales-commission-rule/set-default", params).then(() => {
            this.notificationService.success("提示信息", "设置成功");
            this.getRulesDetail();
        })
    }

    validationData() {
        let isTip: boolean = false;
        if (this.addRuleType === ruleType.default) {
            this.rules.forEach(item => {
                if ((!item.performance_start && item.performance_start !== 0) 
                || (!item.performance_end && item.performance_end !== 0 && !item.checked)
                || (!item.probation &&  item.probation !== 0)
                || (!item.official &&  item.official !== 0)) {
                    isTip = true;
                }
            })
        } else {
            this.rules.forEach(item => {
                if ((!item.performance_start && item.performance_start !== 0) 
                || (!item.performance_end && item.performance_end !== 0 && !item.checked)
                || (!item.rate &&  item.rate !== 0)) {
                    isTip = true;
                }
            })
        }
        return isTip;
    }

    saveRules() {
        let isTip = this.validationData();
        if (isTip) {
            this.notificationService.info("提示信息", "请将数据填写完整");
            return ;
        }

        let rules = this.rules.map(item => {
            let data: any = {
                performance_start: item.performance_start,
                performance_end: item.checked ? -1 : item.performance_end,
            }
            if (this.addRuleType === ruleType.default) {
                data.commission_rate = {};
                data.commission_rate.probation =  parseFloat((parseFloat(item.probation) / 100).toFixed(4));
                data.commission_rate.official = parseFloat((parseFloat(item.official) / 100).toFixed(4));
            } else {
                data.rate = parseFloat((parseFloat(item.rate) / 100).toFixed(4));

            }

            return data;
        })

        let params: any = {
            rules: rules || [],
            name: this.params.name,
            is_default: !!this.params.isDefault,
            type: this.addRuleType,
        };
        if (this.params.id) {
            params.id = this.params.id;
        }

        this.http.post("hall/admin-city/sales-commission-rule/save", params).then(() => {
            this.notificationService.success("提示信息", "保存成功");
            this.closeModal();
            this.getRulesDetail();
        })
    }

    endMoneyChange(value, index: number) {
        let ruleLen = this.rules.length - 1;
        let currentData = this.rules[index];
        if (currentData.performance_start && parseFloat(currentData.performance_start) >= value) {
            this.rules[index].performance_end = parseFloat(currentData.performance_start) + 1;
        }
        if (index < ruleLen) {
            this.rules[index + 1].performance_start = currentData.performance_end ? parseFloat(currentData.performance_end) + 1 : null;
        }

        while (index < ruleLen) {
            let data = this.rules[index];
            if (data && parseFloat(data.performance_end) <= parseFloat(data.performance_start)) {
                data.performance_end = parseFloat(data.performance_start) + 1;
                let nextData = this.rules[index + 1];
                if (nextData) {
                    nextData.performance_start = parseFloat(data.performance_end) + 1;
                }
            }
            index++;
        }
        let lastData = this.rules[ruleLen];
        if (!lastData.checked) {
            if (lastData.performance_start && lastData.performance_end && parseFloat(lastData.performance_end) <= parseFloat(lastData.performance_start)) {
                lastData.performance_end = parseFloat(lastData.performance_start) + 1;
            }
        }
    }

    checkedChange(value, index) {
        if (value) {
            this.rules[index].performance_end = null;
        }
    }

    addRules() {
        if (this.addRuleType === ruleType.team && this.rules.length == 2) {
            console.log("店长只能增加两个");
            return ;
        }
        let prevData = this.rules[this.rules.length - 1];
        let data: any = {};
        if (prevData.performance_end) {
            data.performance_start = parseFloat(prevData.performance_end) + 1
        }
        if (prevData.checked) {
            prevData.checked = false;
        }
        this.rules.push(data);
    }

    removeRules(index: number) {
        this.rules.splice(index, 1);
    }

    closeModal() {
        this.isVisible = false;
        this.params = {};
        this.rules = [];
    }

}
