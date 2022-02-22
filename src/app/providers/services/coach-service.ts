import { HallService } from './hall.service';
import { Injectable } from '@angular/core';
import { Http } from '@yilu-tech/ny';

@Injectable()
export class CoachService {

    constructor(
        private http: Http,
        private hallService: HallService
    ) {

    }

    /**
     * 获取教练列表
     */
    getCoachList(): Promise<any> {
        let currentCity = this.hallService.getCurrentCity();

        let params: any = {
            "action": "query",
            "params": [],
            "fields": ["name", "gender", "coach_group_id", "mobile"],
            "size": 50,
            "page": 1
        }
        return this.http.post("hall/course/admin-city/coach/list?city_id=" + currentCity.id, params);
    }

    /**
     * 获取店铺教练列表
     */
    getHallCoachList(options: any = {}): Promise<any> {
        let params: any = {
            action: "query",
            fields: ["name", "gender", "coach_group_id", "mobile"],
            // page: 1,
            params: [],
            // size: 50,
        }
        if (options.hall_id) {
            params.hall_id = options.hall_id;
        }
        return this.http.post("hall/course/admin-hall/coach/list", params);
    }

    /**
     *  获取所有教练列表
     */

    getAllCoachList(): Promise<any> {
        let params: any = {
            action: "query",
            fields: ["name", "gender", "coach_group_id", "mobile"],
            // page: 1,
            params: [],
            // size: 50,
        }
        return this.http.post('/hall/course/admin/coach/list', params)
    }

}
