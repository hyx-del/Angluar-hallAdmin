import { Injectable } from '@angular/core';
import { Auth } from '@yilu-tech/ny';
import {
    Router,
    CanActivate,
    CanActivateChild,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';


@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {

    constructor(public router: Router, private auth: Auth) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        return this.checkAuth();
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        return this.canActivate(route, state);
    }

    protected checkAuth(): Promise<boolean> {
        let check = this.auth.check();
        if (typeof check === 'boolean') {
            check = Promise.resolve(check);
        }
        return check.then((bool) => {
            if (bool == false) {
                this.router.navigate(['/login']);
            }
            return bool;
        })
    }
}
