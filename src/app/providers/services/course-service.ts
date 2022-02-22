import { Injectable } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/services/hall.service';

@Injectable()
export class CourseService {

    constructor(
        private http: Http,
        private hallService: HallService,
    ) {

    }

    /**
     * 获取课程列表
     */
    getCourseList(): Promise<any> {
        let params: any = {
            "action": "query",
            "params": [],
            "fields": ["id", "name", "name_en", "type", "duration", "max_number", "min_number"],
            // "size": 50,
            "page": 1
        };

        return this.http.post("hall/course/admin/list", params);
    }

    getCityCourseList(): Promise<any> {
        let city_id = this.hallService.getCurrentCity().id;
        let params: any = {
            "action": "query",
            "params": [],
            "fields": ["id", "name", "name_en", "type", "duration", "max_number", "min_number"],
            // "size": 50,
            "page": 1
        };

        return this.http.post("hall/course/admin-city/course/list?city_id=" + city_id, params).then(ret => {
            return { data: ret || [] };
        });
    }

    getShopCourseList(): Promise<any> {
        let hall_id = this.hallService.getCurrentHall().id;
        let params: any = {
            "action": "query",
            "params": [],
            "fields": ["id", "name", "name_en", "type", "duration", "max_number", "min_number"],
            // "size": 50,
            "page": 1
        };

        return this.http.post("hall/course/admin-hall/course/list?hall_id=" + hall_id, params).then(ret => {
            return { data: ret || [] };
        });
    }

}
