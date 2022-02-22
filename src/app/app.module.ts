import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, registerLocaleData } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { AppRouterModule } from './app.router.module';
import { providers } from './app.providers'


import { AppComponent } from './app.component';
import { NgZorroAntdModule, NZ_I18N, NzModalModule, zh_CN } from 'ng-zorro-antd';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import zh from '@angular/common/locales/zh';

import { AppLayoutComponent } from './global/layout/app-layout/app-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from "./pages/home/home.component";
import { PageTabComponent } from './global/layout/page-tab/page.tab';
import { QrcodeModalComponent } from './global/layout/qrcode-modal/qrcode-modal';

import { NyProviderModule, registerConfig } from '@yilu-tech/ny';
import { NyModule } from '@yilu-tech/ny';
import { Config } from './config';

registerConfig(Config);

registerLocaleData(zh);

@NgModule({
    declarations: [
        AppComponent,
        AppLayoutComponent,
        LoginComponent,
        HomeComponent,
        PageTabComponent,
        QrcodeModalComponent,
    ],
    imports: [
        BrowserModule,
        CommonModule,
        AppRouterModule,
        NgZorroAntdModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        NyProviderModule,
        NzModalModule,
        NyModule,
    ],
    providers: [
        providers,
        { provide: NZ_I18N, useValue: zh_CN }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
