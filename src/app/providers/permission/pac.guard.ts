import { Injectable } from '@angular/core';
import {
    Router,
    CanActivate,
    CanActivateChild,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    UrlTree
} from '@angular/router';
import { PacService } from "./pac.service";
import { ROUTES_INFO } from '../routes.info';

@Injectable({
    providedIn: 'root'
})
export class PacGuard implements CanActivate, CanActivateChild {

    constructor(private router: Router, private pacService: PacService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Promise<boolean | UrlTree> {
        let path = state.url.split(/[?;#]/, 2)[0]
        let info = ROUTES_INFO[path];

        if (!info || info.name === '#') {
            return true;
        }

        return this.pacService.stored().then((self) => {
            return self.exists(info.name, info.group || '') ? true : this.getForbiddenRoute(state);
        });
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Promise<boolean | UrlTree> {
        return this.canActivate(route, state);
    }

    protected getForbiddenRoute(state) {
        return this.router.parseUrl('/forbidden#' + state.url);
    }
}
