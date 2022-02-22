import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { CourseService } from '@/providers/index';

@Component({
    selector: 'app-coach-limit',
    templateUrl: './coach-limit.html',
    styleUrls: ['./coach-limit.scss']
})
export class CoachLimitComponent implements OnInit {
    courseLimit: any;
    coachLimitData: any = null;

    courseData: Array<any> = [];

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private courseService: CourseService,
        private modalService: NzModalService,
    ) {

    }

    ngOnInit() {
        this.getCourseList();
    }

    getCourseList() {
        this.courseService.getCourseList().then(data => {
            let groups: any[] = this.generateGroups();
            (data || []).forEach(item => {
                groups[item.type - 1].children.push(item);
            });
            this.courseData = groups;
            this.getCourseLimit();
        })
    }

    generateGroups() {
        let groups: any[] = [];
        let courseTypeMap: any = {
            1: "团课",
            2: "私教课",
            3: "企业课",
        }
        for (let index = 1; index <= 3; index++) {
            groups.push({ type: index, title: courseTypeMap[index], children: [] })
        }
        return groups;
    }

    getCourseLimit() {
        this.http.get("hall/course/admin/coach/get-coach-class-time-limit").then(ret => {
            if (!ret) return;
            this.courseLimit = ret.time_limit || '';
            let courseIds: any[] = ret.limit_courses || [];
            if (!courseIds.length) return;

            this.courseData.forEach(item => {
                item.children.forEach(child => {
                    if (courseIds.indexOf(child.id) >= 0) {
                        child.checked = true;
                    }
                });
            })
        })
    }

    selectAllCourse(group) {
        group.checked = !group.checked;
        group.children.forEach(item => {
            item.checked = group.checked;
        })
    }

    saveCourseLimit() {
        let params: any = {
            time_limit: this.courseLimit,
            limit_courses: this.getCheckCourseIds(),
        };

        this.http.post("hall/course/admin/coach/set-class-time-limit", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
        });
    }

    getCheckCourseIds() {
        let ids = [];
        this.courseData.forEach(item => {
            item.children.forEach(child => {
                if (child.checked) {
                    ids.push(child.id);
                }
            });
        });
        return ids;
    }

    removeSetting() {
        this.modalService.confirm({
            nzTitle: "确定删除设置?",
            nzOnOk: () => {
                this.http.delete("hall/course/admin/coach/delete-class-time-limit").then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.courseLimit = "";
                    this.courseData.forEach(item => {
                        item.children.forEach(child => {
                            child.checked = false;
                        });
                    })
                })
            }
        });
    }
}