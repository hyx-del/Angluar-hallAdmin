export interface BucketOptions {
    video: string,
    admin: string,
}

class _Config {
    public version: string;
    public baseUrl: string;
    public clientId: number;
    public clientSecret: string;
    public ossPath: string;
    // public ossBuckets: BucketOptions;
    public ossBucket: string;
    public buckets: BucketOptions;
    public grantType: string = 'password';
    public scope: string = '*';
    public devWxMpAuthUrl: string;
    public env: 'dev' | 'test' | 'prod';
    public imageMaxSize: number;
}

let config: _Config = require('../../env');

console.log("config", config);

export var Config: _Config = config;
