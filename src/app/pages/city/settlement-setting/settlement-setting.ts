import { Component, OnInit } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { CourseService, HallService } from '@/providers/index';

@Component({
    selector: 'app-settlement-setting',
    templateUrl: './settlement-setting.html',
    styleUrls: ['./settlement-setting.scss']
})
export class SettlementSettingComponent implements OnInit {
    currentCity: any = {};
    isLoading: boolean = false;
    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private courseService: CourseService,
        private hallService: HallService,
    ) { }

    ngOnInit() {
        this.currentCity = this.hallService.getCurrentCity();
        this.getCourseList();
        this.getCoachGroupList();
    }

    courseList: Array<any> = [];
    courseListCopy: Array<any> = [];
    form: nyForm;

    currentCourse: any = {
        rules1: [],
        paymentSetting: {},
    }

    isSetDefaultData: boolean = false;
    isLoadingConfig: boolean = false;

    courseFee: string = '';

    getCourseList() {
        this.courseService.getCityCourseList().then(ret => {
            this.isLoading = true;
            this.courseList = ret.data || [];
            this.courseList.forEach(item => {
                item.rules1 = [];
                item.paymentSetting = {}
            })
            // if (this.courseList.length) {
            //     this.currentCourse = this.courseList[0];
            // }
            this.getDetail();
        })
    }

    getDetail() {
        let currentCity = this.hallService.getCurrentCity();
        this.http.get("hall/course/admin-city/settlement-setting/detail", { city_id: currentCity.id }).then(data => {
            this.courseList.forEach(course => {
                (data.feeSave || []).forEach(item => {
                    if (item.course_id == course.id) {
                        let detail = null;
                        if (Array.isArray(item.detail)) {
                            detail = item.detail;
                        } else {
                            detail = JSON.parse(item.detail);
                        }
                        if (detail && detail.length && detail[0].coach_group_id ) {
                            course.rules1 = detail;
                        }
                        course.assistant_course_fee = item.assistant_course_fee;
                    }
                })
                data.paymentSave.forEach(item => {
                    if (item.course_id == course.id) {
                        course.paymentSetting = item;
                    }
                })
            })
            if (this.courseList.length) {
                this.courseFee = this.courseList[0].assistant_course_fee || '';
            }
            if (!this.coachGroup.length) {
                let timer = setInterval(() => {
                    if (this.coachGroup.length) {
                        clearInterval(timer);
                        this.setDefaultData();
                    }
                }, 100)
            } else {
                this.setDefaultData();
            }
        })
    }
    coachGroup: any[] = [];
    getCoachGroupList() {
        let parmas: any = { "action": "query", "params": [], "fields": ["id", "name", "grade"], "size": 100, "page": 1 };
        this.http.post("hall/course/admin-city/coach/group-list", parmas).then(ret => {
            this.coachGroup = ret.data || [];
        });
    }

    setDefaultData() {
        this.isSetDefaultData = true;
        this.courseList.forEach(course => {
            if (!course.rules1 || !course.rules1.length) {
                course.rules1 = this.coachGroup.map(group => {
                    return { };
                })
            } else {
                let ids: any[] = course.rules1.map(item => item.coach_group_id);
                let detail: any[] = [];
                let rules = [];
                this.coachGroup.forEach(group => {
                    let i = ids.indexOf(group.id);
                    rules.push({});
                    if (i < 0) {
                        detail.push({});
                    } else {
                        detail.push(course.rules1[i]);
                    }
                })
                course.rules1 = rules;
                course.rulesTemp = detail;
            }
        })
        if (this.courseList.length) {
            this.currentCourse = this.courseList[0];
        }
        setTimeout(() => {
            this.courseList.forEach(course => {
                if (!course.rules1 || !course.rules1.length) {
                    this.coachGroup.forEach((group, index) => {
                        course.rules1[index].coach_group_id = group.id;
                    })
                } else {
                    let ids: any[] = [];
                    if (course.rulesTemp) {
                        ids = course.rulesTemp.map(item => item.coach_group_id);
                    }
                    this.coachGroup.forEach((group, index) => {
                        let i = ids.indexOf(group.id);
                        if (i < 0) {
                            course.rules1[index].coach_group_id = group.id;
                        } else {
                            course.rules1[index] = course.rulesTemp[index];
                        }
                    })
                }
            })
        }, 10)
        this.isLoadingConfig = true;
    }

    onFormInit(form: nyForm) {
        this.form = form;
    }

    save() {
        let params: any = {
            city_id: this.currentCity.id,
            course_id: this.currentCourse.id,
        }
        params.detail = this.currentCourse.rules1 || [];
        if (!params.detail) {
            this.notification.info("提示信息", "请填写数据");
            return ;
        }
        this.http.post("hall/course/admin-city/settlement-setting/fee-save", params).then(() => {
            this.notification.success("提示信息", "保存成功");
        }).catch(error => {
            if (error.error.data) {
                this.form.setError(error.error.data)
            }
        })
    }

    savePaymentSetting() {
        // if (!this.currentCourse.paymentSetting.price || !this.currentCourse.paymentSetting.balance_price) {
        //     this.notification.info("提示信息", "请填写完整");
        //     return;
        // }
        let params: any = {
            city_id: this.currentCity.id,
            course_id: this.currentCourse.id,
        }
        let price = this.currentCourse.paymentSetting.price;
        let balance_price = this.currentCourse.paymentSetting.balance_price;
        if (price || price === 0) {
            params.price = price;
        }
        if (balance_price || balance_price === 0) {
            params.balance_price = balance_price;
        }
        console.log("======>params", params, !!price);
        this.http.post("hall/course/admin-city/settlement-setting/payment-save", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
        })
    }

    courseTapHandle(index: number) {
        this.form.clearError();
        let course = this.courseList[index];
        this.currentCourse = course;

        this.courseFee = course.assistant_course_fee || '';
    }
    // 保存助教课时费
    saveAssistantCourseFee() {
        let params = {
            course_id: this.currentCourse.id,
            course_fee: this.courseFee,
        }
        this.http.post("hall/course/admin-city/settlement-setting/assistant-course-fee-save", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
            this.courseList.forEach(item => {
                if (item.id == params.course_id) {
                    item.assistant_course_fee = params.course_fee;
                }
            })
        })
    }
}
