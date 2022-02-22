import { Component, OnInit } from '@angular/core';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { DateCondition, Collection } from "@yilu-tech/ny/search"
import * as dayjs from 'dayjs'
@Component({
    selector: 'app-salary-sheet',
    templateUrl: './salary-sheet.component.html',
    styleUrls: ['./salary-sheet.component.scss']
})
export class SalarySheetComponent implements OnInit {

    public group: any;

    public collection: Collection;

    public listUrl: string;

    public detailsVisible = false;

    public roleManage: any;

    public buttons = [
        { label: '导出', display: true, click: () => this.export() },
    ];

    public userInfoData: any;

    public form: nyForm;

    public actualSalary: any;


    public recordCollection: any;

    public isShow = false;

    public recordUrl: string;

    public detailData: any;

    public isDisabled: any;

    public condition: DateCondition;

    constructor(
        private modalService: NzModalService,
        private http: Http,
        private notification: NzNotificationService,
    ) {
        
    }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.details(item);
        };

        this.collection.onInit = () => {
           this.condition = new DateCondition('payroll.month', '月份',new Date());
           this.condition.format = 'Y-m';
           this.condition.checked = true;
           this.collection.conditions.add(this.condition);
        }
    }


    // 调薪记录
    public setRecordCollection(collection) {
        this.recordCollection = collection;
    }

    // 导出
    public export() {
        this.collection.export('员工工资条', 'all');
    }

    public detailsModalClose() {
        this.detailsVisible = false;
        this.userInfoData = null;
        this.isShow = false;
        this.isDisabled = false;
    }

    // 详情,修改
    public async details(item) {
        if (item) {
            const params = {
                id: item.id,
                month: dayjs(this.condition.value).format('YYYY-MM')
            }
            const data = await this.http.post('finance/salary/admin-hall/staff-payroll/detail', params);

            if (data) {
                console.log("data====>",data);
                
                this.userInfoData = data;

                if(!data.payroll_id){ 
                    this.isDisabled = false;
                }else {
                    this.recordUrl = 'finance/salary/admin-hall/payroll-adjust-record/list?id=' + data.payroll_id
                    this.isDisabled = true;
                }

                Object.keys(data).forEach(key => {
                    if (!data[key]) {
                        data[key] = "0.00";
                    }
                    if (key == 'penalty_reason' || key == 'remark') {
                        data[key] = null;
                    }
                    
                    if (key == 'payroll_id') {
                        
                        if (!parseInt(data[key])) {
                            data[key] = null;
                        }
                    }
                })

                this.form.body = data;
                
                this.countActualSalary();
            }
        }

        this.detailsVisible = true;
    }

    // 计算实际的工资
    public countActualSalary() {
       
        if (this.userInfoData && this.form.body) {
            const bodyData = this.form.body;

            // 获得的金额项
            const basic_salary = parseFloat(bodyData.basic_salary || 0); // 基本工资
            const course_fee = parseFloat(bodyData.course_fee || 0); // 课时费
            const performance_fee = parseFloat(bodyData.performance_fee || 0); // 业绩提成
            const housing_subsidy = parseFloat(bodyData.housing_subsidy || 0); // 房补
            const bonus = parseFloat(bodyData.bonus || 0); // 奖金
        
            // 要扣除的金额项
            const personal_income_tax = parseFloat(bodyData.personal_income_tax || 0); // 个人所得税
            const social_security = parseFloat(bodyData.social_security || 0); // 社保
            const personal_leave_deductions = parseFloat(bodyData.personal_leave_deductions || 0); // 事假
            const sick_leave_deductions = parseFloat(bodyData.sick_leave_deductions || 0); // 病假
            const absenteeism_deductions = parseFloat(bodyData.absenteeism_deductions || 0); // 旷工
            const penalty_deductions = parseFloat(bodyData.penalty_deductions || 0); // 罚款
            const other_fee = parseFloat(bodyData.other_fee || 0); // 其他

            // 获取得金额
            const GET_FEE = basic_salary + course_fee + performance_fee + housing_subsidy + bonus + other_fee;


            // 扣除的金额
            const DEDUCT_FEE = social_security + personal_leave_deductions + sick_leave_deductions + absenteeism_deductions + penalty_deductions + personal_income_tax;

            // 实际工资
            this.actualSalary = GET_FEE - DEDUCT_FEE;
        }
    }

    // 验证提交的数据
    public onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
             
            body.id = this.form.body.id;
            body.payroll_id = this.form.body.payroll_id;
            body.month = dayjs(this.condition.value).format('YYYY-MM')
        };
    }

    // 是否显示保存按钮
    public isAmend(event) {
        if(event.index !== 0){
            this.isShow = true;
            return ;
        } 
        this.isShow = false;
    }

    public async save() {
        this.form.action = 'finance/salary/admin-hall/staff-payroll/save';
        try {
            await this.form.submit();
            this.notification.success('提示信息', '修改成功');
            this.details(this.userInfoData);
            this.isDisabled = false;
            // this.form.body = {};
            // this.userInfoData = null;
            // this.collection.load();
        } catch (error) {
            console.log(error)
        }
    }

}
