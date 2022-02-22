import { NgModule } from '@angular/core';
import { Route, RouterModule, RouteReuseStrategy, PreloadAllModules } from '@angular/router';

import { CustomReuseStrategy } from './providers/strategy/CustomReuseStrategy';
import { CityResolve, HallResolve, HallService } from './providers/index';

import { AppLayoutComponent } from './global/layout/app-layout/app-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { EmptyComponent } from './pages/empty.component';
import { AuthGuard } from "@/providers/auth.guard";
import { PacGuard } from "@/providers/permission";

interface RouteExtra extends Route {
    name?: string;

    group?: string;

    children?: Routes;
}

export declare type Routes = RouteExtra[]


const routes: Routes = [
    {
        path: '',
        component: AppLayoutComponent,
        canActivateChild: [AuthGuard, PacGuard],
        children: [
            { path: '', redirectTo: "/home", pathMatch: 'full' },
            { path: 'home', component: HomeComponent },
            { path: 'forbidden', component: ForbiddenComponent },
            { path: 'headquarters', loadChildren: './pages/headquarters/headquarters.module#HeadquartersModule', group: '' },
            { path: 'workers', loadChildren: './pages/workers/workers.module#WorkersModule', group: '' },
            { path: 'member', loadChildren: './pages/member/member.module#MemberModule', group: '' },
            { path: 'cms', loadChildren: './pages/cms/cms.module#CmsModule', group: '' },
            { path: 'video', loadChildren: './pages/video/video.module#VideoModule', group: '' },
            { path: 'test', loadChildren: './pages/test/test.module#TestModule' },
            { path: 'city', loadChildren: './pages/city/city.module#CityModule', group: 'city', resolve: { city: CityResolve } },
            { path: 'shop', loadChildren: './pages/shop/shop.module#ShopModule', group: 'hall', resolve: { shop: HallResolve } },
        ]
    },
    { path: 'login', component: LoginComponent },
    { path: 'empty', component: EmptyComponent },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { useHash: true, preloadingStrategy: PreloadAllModules }),
    ],

    declarations: [
        EmptyComponent,
        ForbiddenComponent
    ],

    providers: [
        { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
        AuthGuard,
        PacGuard,
        HallResolve,
        CityResolve,
        HallService
    ],

    exports: [RouterModule]
})
export class AppRouterModule {
}
