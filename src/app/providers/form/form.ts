import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { FormContainer } from './form.container';

declare abstract class Http {
    request(method: string, url: any, options: { query?: any, body?: any, headers?: any }): Promise<HttpResponse<any> | HttpErrorResponse>;
}

export function registerFormHttp(http: Http) {
    Form.http = http;
}

export class Form extends FormContainer {

    public static http: Http;

    public method: string = 'POST';

    public action: string;

    public names: Array<string | { name: string, value?: any, from: string }> = [];

    public onSubmit: (body: any) => void;

    public validateHeartBeats: number = 500;

    public requestFilter: Function;

    private _validating: boolean;

    private _validateTimer;

    private _errorControls: Array<any> = [];

    public constructor(body?: any) {
        super();
        this.root = this;
        this.setBody(body);

        this.onChange = (simpleChange) => {
            if (simpleChange.control.getError()) {
                this.validate();
            }
        };
    }

    public setBody(value?: any) {
        this.value = value;
        return this.value;
    }

    public getBody(filter?: Function) {
        return this.toObject(filter);
    }

    public submit(options: any = {}) {
        if (!Form.http) {
            throw Error('form api not register.');
        }
        options.body = this.getBody(options.filter || this.requestFilter);

        this.onSubmit && this.onSubmit(options.body);

        return Form.http.request(this.method, this.action, options).catch((errorResponse) => this.handleRequestError(errorResponse));
    }

    public validate() {
        this._validating = true;
        if (this._validateTimer) {
            clearTimeout(this._validateTimer);
        }
        this._validateTimer = setTimeout(() => this.submit({
            headers: { 'Xhr-Form-Validator': Date.now().toString() },
        }).then(
            () => {
                this.clearErrors();
                this._validating = false
            },
            () => this._validating = false
        ), this.validateHeartBeats);
    }

    public hasError() {
        return this._errorControls.length > 0;
    }

    public setErrors(errors: { [key: string]: string[] }) {
        for (let name in errors) {
            const control = this.getControl(name.split('.'));
            this._errorControls.push(control);
            control.setError(errors[name]);
        }
        return this;
    }

    public clearErrors() {
        this._errorControls.forEach((item) => item.setError(null));
        this._errorControls = [];
        return this;
    }

    private handleRequestError(errorResponse: HttpErrorResponse) {
        this.clearErrors();
        if (errorResponse.status === 422 && errorResponse.error.data) {
            this.setErrors(errorResponse.error.data);
        }
        throw errorResponse;
    }
}
