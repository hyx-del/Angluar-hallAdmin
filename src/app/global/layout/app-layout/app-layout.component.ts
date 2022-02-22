import { Component, OnInit } from '@angular/core';
import { Router, ChildrenOutletContexts, PRIMARY_OUTLET } from '@angular/router';
import { Auth, Cache, Http } from '@yilu-tech/ny';
import { MenuManager, MenuDropdown } from './../../menu';
import { RouteStash } from '@/providers/strategy/route.stash';
import { PacService } from '@/providers/permission';
import { HallService, FileUploadService } from '@/providers/index';
import { NzNotificationService } from "ng-zorro-antd";
import { Config } from '@/config';

@Component({
    selector: 'app-layout',
    templateUrl: './app-layout.component.html',
    styleUrls: ['./app-layout.component.scss'],
})
export class AppLayoutComponent implements OnInit {
    public collapsed: boolean = false;

    public user: any = {};

    public formData: any = {};
    public changePasswordVisible: boolean;
    public progressFormat = (num) => {
        return num == 100 ? '100%' : num.toFixed(2) + '%'
    };

    public progressStatus = (task) => {
        switch (task.state()) {
            case 'Failure':
                return 'exception';
            case 'Uploading':
                return 'active';
            case 'Success':
                return 'success';
            default:
                return 'normal';
        }
    };

    public isVisible: boolean;

    public get component(): any {
        return this.parentContexts.getContext(PRIMARY_OUTLET).outlet.component;
    }
    public config = Config;

    public form: nyForm;

    constructor(
        public menu: MenuManager,
        private router: Router,
        private auth: Auth,
        private http: Http,
        private cache: Cache,
        private hallService: HallService,
        private pacService: PacService,
        private parentContexts: ChildrenOutletContexts,
        private fileUploadService: FileUploadService,
        private notification: NzNotificationService
    ) {
        this.user = this.auth.user();
    }

    ngOnInit() {
    }

    public progress() {
        return this.fileUploadService.progress() * 100;
    }

    public uploadTasks() {
        return this.fileUploadService.tasks;
    }

    loginOut() {
        this.auth.loginOut();
        this.cache.clear();
        RouteStash.main.unstash().clear();
        this.router.navigate(['login']);
    }

    public checkOption(menuItem, option) {
        if (option.checked) {
            return;
        }
        this.menu.checkOption(menuItem, option);
        if (menuItem.group === 'hall') {
            this.hallService.setCurrentHall(option);
        }
        if (menuItem.group === 'city') {
            this.hallService.setCurrentCity(option);
            MenuDropdown.hall.options = this.hallService.getCityHalls();
            MenuDropdown.hall.selected = this.hallService.getCurrentHall();
        }
        this.pageReload().then(() => {
            this.menu.refresh();
        });
    }

    pageReload() {
        RouteStash.main.unstash().clear();
        let url = this.router.url;
        return this.router.navigateByUrl('/empty', { skipLocationChange: true }).then(() => this.router.navigateByUrl(url));
    }

    showQrcodeModal() {
        this.isVisible = true;
    }

    public cancelPasswordVisible() {
        this.changePasswordVisible = false;
        this.form.clearError();
        this.form.body = {};
    }

    public changePassword() {
        if (!this.form.body.old_password) {
            this.notification.info('提示信息', '请输入旧密码!');
            return;
        }

        if (!this.form.body.password) {
            this.notification.info('提示信息', '请输入新密码!');
            return;
        }

        if (!this.form.body.password_confirmation) {
            this.notification.info('提示信息', '请输入确认密码!');
            return;
        }

        if (this.form.body.password !== this.form.body.password_confirmation) {
            this.notification.info('提示信息', '两次密码不一致!');
            return;
        }

        this.form.action = 'staff/info/changepassword';
        this.form.submit().then(res => {
            this.cancelPasswordVisible();
            this.notification.success('提示', '密码修改成功');
        })
    }

    public subForm() {        
        this.form.request = this.http.request.bind(this.http);
    }
}
