import { Injectable } from '@angular/core';
import { HttpRequest, HttpMiddleware, AuthToken } from '@yilu-tech/ny';
import { NzNotificationService } from "ng-zorro-antd";

@HttpMiddleware() @Injectable()
export class HandleResponse implements HttpMiddleware {

    public constructor(private authToken: AuthToken, private notificationService: NzNotificationService) {

    }

    handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        return next(request).then((response) => {
            if (request.getResponseType() == "blob" || request.getResponseType() == "arraybuffer") {
                return response;
            }
            if ('data' in response) {
                return response.data;
            }
            if ('pagination' in response) {
                return response.pagination;
            }
            return response;
        }).catch((errorResponse) => {
            switch (errorResponse.status) {
                case 400:
                    if (errorResponse.error.message) {
                        this.notificationService.error('错误提示', errorResponse.error.message);
                    }
                    break;
                case 401:
                    if (this.authToken.exists()) {
                        this.notificationService.error('错误提示', '授权信息已失效');
                    }
                    break;
                case 403:
                    this.notificationService.error('错误提示', '您没有权限操作');
                    break;
                case 422:
                    if (!request.getHeaders().has('validator-request') && !request.getHeaders().has('Xhr-Form-Validator')) {
                        this.notificationService.error('验证错误', '表单验证错误');
                    }
                    break;
                case 500:
                    this.notificationService.error('服务错误', errorResponse.error.message);
                    break;
                default:
                    break;
            }
            throw errorResponse;
        });
    }
}
