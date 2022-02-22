import { Injectable } from "@angular/core";
import { Resolve } from '@angular/router';
import { HallService } from '@/providers/services/hall.service';
import { HttpMiddleware, HttpRequest } from "@yilu-tech/ny";

@Injectable()
export class HallResolve implements Resolve<any>, HttpMiddleware {
    constructor(private hallService: HallService) {

    }

    resolve(route) {
        return this.hallService.do(() => this.hallService.getCurrentHall())
    }

    public handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        if (request.getUrl().indexOf("staff/manage/list") > 0 && !request.getParams()['group']) {
            request.addParams('group', "hall");
        }
        if (!request.hasParams("hall_id")) {
            let hall = this.hallService.getCurrentHall();
            request.addParams('hall_id', hall && hall.id);
        }
        return next(request);
    }
}
