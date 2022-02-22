import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd';
import { Auth, Http } from '@yilu-tech/ny';
import { Router } from '@angular/router';
import { HallService } from '@/providers/services/hall.service';
import { PacService } from '@/providers/permission';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
    validateForm: FormGroup;
    registerForm: FormGroup;
    isLogin: boolean = true;

    constructor(
        private fb: FormBuilder,
        private auth: Auth,
        private notification: NzNotificationService,
        private router: Router,
        private http: Http,
        private hallService: HallService,
        private pacService: PacService,
    ) {
    }

    ngOnInit(): void {
        this.checkAuth();

        this.validateForm = this.fb.group({
            username: [null, [Validators.required]],
            password: [null, [Validators.required]],
        });
        this.registerForm = this.fb.group({
            name: [null, [Validators.required]],
            mobile: [null, [Validators.required, Validators.pattern('^1[3-9]\\d{9}$')]],
            password: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(16)]],
            confirmPassword: [null, [Validators.required]]
        }, {
            validator: this.checkPasswords
        })

        console.log(this);
    }

    public login(): void {
        for (const i in this.validateForm.controls) {
            this.validateForm.controls[i].markAsDirty();
            this.validateForm.controls[i].updateValueAndValidity();
        }
        if (this.validateForm.value.username && this.validateForm.value.password) {
            this.auth.login(this.validateForm.value.username, this.validateForm.value.password).then((e) => {
                this.hallService.refresh();
                return this.pacService.storePermission().then(() => this.redirect());
            }).catch((response) => {
                if (response.status !== 401) {
                    return;
                }
                switch (response.error.error) {
                    case 'invalid_credentials':
                        this.validateForm.get('username').setErrors({ invalid: true });
                        break;
                    case 'invalid_password':
                        let times = response.error.message.match(/(\d)\serrors/)[1];
                        this.validateForm.get('password').setErrors({ invalid: { times } });
                        break;
                    case 'password_limit':
                        this.validateForm.get('password').setErrors({ limit: true });
                        break;
                    default:
                        break;
                }
                console.log(response);
                // this.notification.error('提示信息', '登录失败，请检查用户名和密码');
            })
        }
    }

    public checkAuth() {
        let check = this.auth.check();
        if (typeof check === 'boolean') {
            check = Promise.resolve(check);
        }
        return check.then((bool) => {
            if (bool) {
                this.redirect();
            }
            return bool;
        })
    }

    public redirect() {
        let navigation = this.router['lastSuccessfulNavigation'].previousNavigation;
        if (navigation) {
            let option = this.getUrlOption(this.router.config, navigation.finalUrl.toString());
            if (option && (!option.name || this.pacService.exists(option.name, option.group))) {
                return this.router.navigateByUrl(navigation.finalUrl);
            }
        }
        let path = this.getAvailableRoutePath(this.router.config)
        return this.router.navigateByUrl(path || '/');
    }

    register() {
        for (const i in this.registerForm.controls) {
            this.registerForm.controls[i].markAsDirty();
            this.registerForm.controls[i].updateValueAndValidity();
        }
        if (this.registerForm.value.name && this.registerForm.value.mobile
            && this.registerForm.value.password && this.registerForm.value.confirmPassword) {
            let params: any = {
                name: this.registerForm.value.name,
                mobile: this.registerForm.value.mobile,
                password: this.registerForm.value.password,
            }
            this.http.post("staff/create", params).then(ret => {
                this.notification.success('提示信息', '注册成功');
                this.auth.login(params.mobile, this.registerForm.value.password).then((e) => {
                    this.redirect();
                })
            })
        }
    }

    checkPasswords(group: FormGroup) {
        const password = group.controls['password'];
        const confirmPassword = group.controls['confirmPassword'];
        if (confirmPassword.errors && !confirmPassword.errors.mustMatch) {
            return;
        }
        if (password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ mustMatch: true });
        } else {
            confirmPassword.setErrors(null);
        }
    }

    changeType() {
        this.isLogin = !this.isLogin;
        if (this.isLogin) {
            this.validateForm.reset();
        } else {
            this.registerForm.reset();
        }
    }

    protected getAvailableRoutePath(routes, group?: string, prefix = '') {
        for (let route of routes) {
            if (route.path === 'forbidden' || route.path === 'login') {
                continue;
            }
            if (route.redirectTo || (route.loadChildren && !route._loadedConfig)) {
                continue;
            }
            let url = route.path ? prefix + '/' + route.path : prefix;
            let currGroup = route.group || group;
            let children = route.children || (route._loadedConfig && route._loadedConfig.routes);
            if (children) {
                let path = this.getAvailableRoutePath(children, currGroup, url);
                if (path) {
                    return path;
                }
            } else if (!route.name || this.pacService.exists(route.name, currGroup)) {
                return url;
            }
        }
        return null;
    }

    protected getUrlOption(routes, url: string, group?: string, prefix = '') {
        for (let route of routes) {
            let _url = route.path ? prefix + '/' + route.path : prefix;
            let currGroup = route.group || group;
            let children = route.children || (route._loadedConfig && route._loadedConfig.routes);
            if (children) {
                let option = this.getUrlOption(children, url, currGroup, _url);
                if (option) {
                    return option;
                }
            } else if (url === _url) {
                return { name: route.name, group: currGroup };
            }
        }
        return null;
    }
}
