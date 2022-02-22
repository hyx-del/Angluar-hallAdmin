import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { registerFormHttp } from './providers/form';

@Component({
    selector: 'app-root',
    template: '<router-outlet></router-outlet>',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
    title = 'fy';

    constructor(private http: Http) {
        registerFormHttp(http);
    }

    public ngOnInit(): void {

    }
}
