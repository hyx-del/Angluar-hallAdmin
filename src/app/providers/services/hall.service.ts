import { Injectable, EventEmitter } from '@angular/core';
import { Http, Cache, Auth } from '@yilu-tech/ny';

@Injectable()
export class HallService {

    public onChange: EventEmitter<any> = new EventEmitter<any>();
    public onLoaded: EventEmitter<any> = new EventEmitter<any>();

    public loaded: boolean;

    protected _currentHall: any;
    protected _currentCity: any;

    protected _hallList: Array<any> = [];
    protected _cityList: Array<any> = [];

    protected _loading: Promise<any>;

    constructor(private http: Http, private cache: Cache, private auth: Auth) {
        this.refresh();
    }

    public resolve(group) {
        switch (group) {
            case 'city':
                let city = this.getCurrentCity();
                return 'city:' + (city ? city.id : '');
            case 'hall':
                let hall = this.getCurrentHall();
                return 'hall:' + (hall ? hall.id : '');
            default:
                return group;
        }
    }

    public async prepared() {
        if (this._loading) {
            await this._loading;
        }
        return this;
    }

    public do(callback: () => void): Promise<any> {
        return this._loading ? this._loading.then(callback) : Promise.resolve(callback());
    }

    public setCurrentCity(city: any, hallId ?: any) {
        if (this._currentCity) {
            this._currentCity.checked = false;
        }
        this._currentCity = city;
        if (this._currentCity) {
            this._currentCity.checked = true;
        }
        this._hallList = this.getCityHalls();

        this.cache.forever('currentCityKey', city ? city.id : '');
        this.onChange.emit({ city });

        this.setCurrentHall(hallId ? this._hallList.find(_ => _.id == hallId) : this._hallList[0]);
    }

    public getCurrentCity() {
        return this._currentCity;
    }

    public setCurrentHall(hall: any) {
        if (this._currentHall) {
            this._currentHall.checked = false;
        }
        this._currentHall = hall;
        if (this._currentHall) {
            this._currentHall.checked = true;
        }
        this.cache.forever('currentHallKey', hall ? hall.id : '');
        this.onChange.emit({ hall });
    }

    public getCurrentHall() {
        return this._currentHall;
    }

    public getCityHalls(city?: any) {
        city = city || this.getCurrentCity();
        return city ? city.halls : [];
    }

    public getCities() {
        return this._cityList;
    }

    public getHalls() {
        return this._hallList;
    }

    getHallList() {
        return this.http.get("hall/admin/get-city-halls").then(ret => {
            return (ret || []).map(item => {
                return {
                    id: item.id,
                    name: item.name,
                    city_name: item.name,
                    children: item.halls,
                }
            });
        })
    }

    public refresh() {
        this.loaded = false;
        this._loading = this.check().then((bool) => {
            if (bool) {
                return this.restoreHalls()
            }
            this._hallList = this._cityList = [];
            this._currentHall = this._currentCity = null;
            return null;
        }).then(() => {
            this._loading = null;
            this.loaded = true;
            this.onLoaded.emit()
        });
    }

    private check() {
        let check = this.auth.check();
        if (typeof check === 'boolean') {
            return Promise.resolve(check);
        }
        return check;
    }

    private restoreHalls() {
        return this.http.get('hall/admin/auth-info/halls').then((ret) => {
            this._cityList = ret;
            this._currentCity = null;
            const currentCityKey = this.cache.get('currentCityKey');
            for (let city of this._cityList) {
                this._hallList = this._hallList.concat(city.halls);
                if (city.id == currentCityKey) {
                    this.setCurrentCity(city, this.cache.get('currentHallKey'))
                }
            }
            if (!this._currentCity) {
                this.setCurrentCity(ret[0]);
            }
        });

    }

    allHallList: any[] = [];

    getAllHalls(): Promise<any> {
        if (this.allHallList.length) {
            return new Promise((resove) => {
                resove(this.allHallList);
            })
        } else {
            return this.http.get("hall/admin/get-halls").then(data => {
                this.allHallList = data || [];
                return data || [];
            })
        }
    }
}
