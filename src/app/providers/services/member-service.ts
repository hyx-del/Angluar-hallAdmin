import { Injectable } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { HallService } from './hall.service';

@Injectable()
export class MemberService {
    // 出行习惯
    tripMode: any[] = [
        { label: "步行", value: 1 },
        { label: "驾车", value: 2 },
        { label: "公交地铁", value: 3 },
        { label: "骑行", value: 4 },
        { label: "其他", value: 0 },
    ]
    
    // 课程需求
    requirements: any[] = [
        { label: "减脂", value: 1 },
        { label: "减压", value: 2 },
        { label: "备孕", value: 3 },
        { label: "产前", value: 4 },
        { label: "产后", value: 5 },
        { label: "塑形", value: 6 },
        { label: "体式", value: 7 },
        { label: "理疗", value: 8 },
        { label: "其他", value: 0 },
    ]

    constructor(
        private http: Http,
        private hallService: HallService,

    ) {

    }

    /**
     * 获取会员来源
     */
    getMemberSourceList(): Promise<any> {
        let params: any = {
            "action": "query",
            "params": [],
            "fields": ["id", "name"],
            // "size": 50,
            // "page": 1
        }
        return this.http.post("hall/member/common/source/list", params);
    }

    /**
     * 获取支付方式
     */
    getMemberPaymentList(): Promise<any> {
        let params = {
            "action": "query",
            "params": [["status", "=", 1]],
            "fields": ["name", "status"],
            "size": 200,
            "page": 1
        }
        return this.http.post("hall/admin-hall/payment-mode/list?hall_id=" + this.hallService.getCurrentHall().id, params);
    }
}
