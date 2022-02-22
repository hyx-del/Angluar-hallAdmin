import { Injectable } from '@angular/core';
import { Http } from '@yilu-tech/ny';

@Injectable()
export class FileService {
    private buckets: any = {};

    private getInfoPending: Promise<any>;

    constructor(private http: Http) {

    }

    public getBucketInfo(bucket: string) {
        return new Promise((resolve, reject) => {
            if (this.getInfoPending) {

                this.getInfoPending.then(() => resolve(this.buckets[bucket]));

            } else if (bucket in this.buckets) {

                resolve(this.buckets[bucket]);

            } else {
                this.getInfoPending = this.http.get('file/info', {bucket}).then((ret) => {
                    this.getInfoPending = null;
                    if (!ret.errcode) {
                        let href = ret.host + '/' + ret.root;
                        this.buckets[bucket] = href;
                        resolve(href);
                    } else {
                        reject(ret);
                    }
                }).catch((err) => {
                    this.getInfoPending = null;
                    reject(err);
                });
            }
        });
    }

    public delete(bucket, paths: string[]) {
        return this.http.post('file/delete?bucket=' + bucket, {paths});
    }
}
