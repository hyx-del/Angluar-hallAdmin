import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/services/hall.service';

@Component({
    selector: 'app-qrcode-modal',
    templateUrl: './qrcode-modal.html',
    styleUrls: ['./qrcode-modal.scss']
})
export class QrcodeModalComponent implements OnInit, OnChanges {
    @Input() isVisible: boolean;
    @Output() isVisibleChange: EventEmitter<any> = new EventEmitter();

    timeHidden: boolean = false;

    info: any = {};

    refreshTime: number = 5;
    timer: any;
    hasOverdue: boolean = false;
    isSpin: boolean = false;

    constructor(
        private http: Http,
        private hallService: HallService,
    ) { }

    ngOnInit() {
        // this.getQrcodeInfo();
    }

    ngOnChanges(val: SimpleChanges) {
        if (val.isVisible.currentValue) {
            this.getQrcodeInfo();
        }
    }


    startTimer() {
        // 最大间隔为 2147483647 
        let time = Math.min(Math.pow(2,31) - 1, this.refreshTime * 1000 * 60);
        
        this.timer = setInterval(() => {
            this.hasOverdue = true;
            clearInterval(this.timer);
            this.timer = null;
            this.refreshQrcode();
        }, time);
    }

    refreshQrcode() {
        this.isSpin = true;
        this.getQrcodeInfo();
    }

    getQrcodeInfo() {
        let currentHall = this.hallService.getCurrentHall();
        this.refreshTime = currentHall.qrcode_expire_time || 5;

        let params = {
            hall_id: currentHall.id
        }
        this.http.get("hall/admin-hall/signinqrcode", params, { responseType: 'blob' }).then(ret => {
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

    handleCancel() {
        this.isVisibleChange.emit(false);
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
}
