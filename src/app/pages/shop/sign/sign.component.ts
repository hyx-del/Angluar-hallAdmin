import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-sign',
    templateUrl: './sign.component.html',
    styleUrls: ['./sign.component.scss']
})
export class SignComponent implements OnInit, OnDestroy {
    info: any = {};

    refreshTime: number = 5;
    timer: any;
    hasOverdue: boolean = false;
    isSpin: boolean = false;

    constructor(
        private http: Http,
    ) { }

    ngOnInit() {
        this.getQrcodeInfo();
    }

    startTimer() {
        this.timer = setInterval(() => {
            // this.hasOverdue = true;
            // clearInterval(this.timer);
            // this.timer = null;
            this.refreshQrcode();
        }, this.refreshTime * 1000 * 60);
    }

    refreshQrcode() {
        this.isSpin = true;
        this.getQrcodeInfo();
    }

    getQrcodeInfo() {
        this.http.get("hall/admin-hall/signinqrcode", {}, { responseType: 'blob' }).then(ret => {
            this.isSpin = false;
            this.hasOverdue = false;
            const imageUrl = URL.createObjectURL(ret);
            let img = document.querySelector('#qrcode');
            img.addEventListener('load', () => URL.revokeObjectURL(imageUrl));
            img['src'] = imageUrl;
            if (!this.timer) {
                this.startTimer();
            }
        })
    }

    onHide() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    onShow() {
        this.refreshQrcode();
    }

    ngOnDestroy() {
        console.log("ngOnDestroy");
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    
}
