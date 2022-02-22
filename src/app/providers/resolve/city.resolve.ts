import { Injectable } from "@angular/core";
import { Resolve } from '@angular/router';
import { HttpMiddleware, HttpRequest } from "@yilu-tech/ny";
import { HallService } from "@/providers/services/hall.service";

@Injectable()
export class CityResolve implements Resolve<any>, HttpMiddleware {
    constructor(private hallService: HallService) {

    }

    resolve(route) {
        return this.hallService.do(() => this.hallService.getCurrentCity())
    }

    public handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        if (request.getUrl().indexOf("staff/manage/list") > 0 && !request.getParams()['group']) {
            request.addParams('group', "city");
        }
        
        if (!request.hasParams("city_id")) {
            let city = this.hallService.getCurrentCity();
            request.addParams('city_id', city && city.id);
        }
        return next(request)
    }
}
