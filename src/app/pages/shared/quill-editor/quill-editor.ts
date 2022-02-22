import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import * as Quill from 'quill';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/index';
import { defaultOptions, defaultNotLinkOptions } from './options';

import { Config } from '@/config';

window['Quill'] = Quill;
import { ProductBlot, getProductHtml } from './product-format';

Quill.register({
    'formats/product': ProductBlot,
});

@Component({
    selector: 'quill-editor',
    template: `
        <div #editor></div>`,
})

export class QuillEditorComponent implements OnInit, AfterViewInit {
    @Input() imageResize: boolean = false;
    @Input() options: Object;
    @Input() ossBucket: string;
    @Input() showLink: boolean = false;
    @Input('disable') isDisable: boolean = false;

    @Output() textChange: EventEmitter<any> = new EventEmitter();
    @Output() linkHandle: EventEmitter<any> = new EventEmitter();
    @ViewChild('editor') editorel: ElementRef;

    editor: any;
    public ossPath: string = '';
    imageResizeModule: any;

    constructor(
        private http: Http,
        private fileService: FileService
    ) {
        // this.fileService.getBucketInfo(this.ossBucket || Config.buckets.admin).then((ret: string) => {
        //     this.ossPath = ret;
        // });
    }

    ngOnInit() {
        this.fileService.getBucketInfo(this.ossBucket || Config.buckets.admin).then((ret: string) => {
            this.ossPath = ret;
        });
    }

    ngAfterViewInit() {
        let options;
        if (this.showLink) {
            options = Object.assign({}, defaultOptions, this.options);
        } else {
            options = Object.assign({}, defaultNotLinkOptions, this.options);
        }

        this.editor = new Quill(this.editorel.nativeElement, options);
        this.editor.on('text-change', (delta, oldDelta, source) => this.editChange());

        this.editor.getModule('toolbar').addHandler('image', () => {
            if (this.isDisable) return ;
            this.selectLocalImage();
        });

        // this.editor.getModule('toolbar').addHandler('link', (value, b) => {
        //     let range = this.editor.getSelection();
        //     console.log("value", value, b);
        //     if (range == null || range.length == 0) {
        //         return;
        //     }
        //     this.linkHandle.emit();
        // });

        this.editor.getModule('toolbar').addHandler('align', (value) => {
            if (this.isDisable) return;
            let range = this.editor.getSelection();
            let lines = range.length ? this.editor.getLines(range.index, range.length) :
                [this.editor.getLine(range.index)[0]];
            lines.forEach(line => {
                line.domNode.style.textAlign = value || null;
            });
            this.editChange();
        });
        if (this.imageResize) {
            import('quill-image-resize-module/image-resize.min').then(data => {
                this.imageResizeModule = data.default;
                new this.imageResizeModule(this.editor);
            });
        }

        if (this.isDisable) {
            this.editor.disable();
            this.editor.root.setAttribute("data-placeholder", "");
        }
        // this.editor.insertText(0, '\n');
        // this.editor.insertEmbed(1, 'product', { name: '这个是名称', price: "10.00" });
        // this.editor.insertText(2, '\n');
        // this.editor.setSelection(3)
    }

    clearImageResizeBorder() {
        let imageResize = this.editor.getModule('imageResize');
        if (imageResize) {
            imageResize.hide();
        }
    }

    public editChange() {
        this.textChange.emit(this.editor);
    }

    appendChild(data) {
        this.editor.root.appendChild(data);
    }

    setHtml(html: string = '') {
        if (this.editor) {
            this.editor.root.innerHTML = html;
        }
    }

    public getHtmlToJson() {
        if (this.editor) {
            return this.htmlEncode(this.editor.root);
        }
        return {};
    }

    public getHtmlToJsonSting() {
        return JSON.stringify(this.getHtmlToJson());
    }

    public setHtmlByJsonString(data: string) {
        this.editor.root.innerHTML = '';
        if (!data) {
            return;
        }
        const nodes = JSON.parse(data);
        if (Array.isArray(nodes.children)) {
            nodes.children.forEach((line) => this.editor.root.appendChild(this.htmlDecode(line)));
        }
    }

    public htmlEncode(node) {
        let _node: any = {name: node.nodeName};
        if (node.classList && node.classList.contains('ql-product-block')) {
            _node.name = 'PRODUCT';
        }
        switch (_node.name) {
            case 'A':
                _node.href = '/' + node.getAttribute('href');
                break;
            case 'IMG':
                _node.src = node.src;
                break;
            case 'VIDEO':
                _node.src = node.src;
                break;
            case 'PRODUCT':
                _node.id = node.getAttribute('data-id');
                _node.product_name = node.getAttribute('data-product_name');
                _node.price = node.getAttribute('data-price');
                _node.thumb_url = node.getAttribute('data-thumb_url');
                _node.class = node.getAttribute('class');
            default:
                break;
        }
        if (_node.name !== '#text' && node.getAttribute('style')) {
            _node.style = node.getAttribute('style');
        }
        if (_node.name != 'PRODUCT') {
            if (node.childNodes && node.childNodes.length) {
                _node.children = [];
                for (let item of node.childNodes) {
                    _node.children.push(this.htmlEncode(item));
                }
            } else {
                _node.text = node.nodeValue;
            }
        }
        return _node;
    }

    public htmlDecode(node) {
        if (node.name == 'PRODUCT') {
            let _node = document.createElement('div');
            _node.setAttribute('data-id', node.id);
            _node.setAttribute('data-product_name', node.product_name);
            _node.setAttribute('data-price', node.price);
            _node.setAttribute('data-thumb_url', node.thumb_url);
            _node.setAttribute('contenteditable', 'false');
            _node.setAttribute('class', node.class);
            _node.innerHTML = getProductHtml(node);
            return _node;
        } else if (node.name !== '#text' && node.name != 'PRODUCT') {
            let _node = document.createElement(node.name);
            if (node.style) {
                _node.setAttribute('style', node.style);
            }
            switch (node.name) {
                case 'IMG':
                    _node.setAttribute('src', node.src);
                case 'A':
                    _node.setAttribute('href', node.href);
                    break;
            }
            if (node.children) {
                for (let item of node.children) {
                    let childNode = this.htmlDecode(item);
                    if (typeof childNode === 'string') {
                        _node.innerText = childNode;
                    } else {
                        _node.appendChild(childNode);
                    }
                }
            }
            return _node;
        } else {
            return node.text;
        }
    }

    public selectLocalImage() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('multiple', 'true');
        input.setAttribute('accept', 'image/jpeg,image/jpg,image/png');
        input.click();

        input.onchange = () => {
            this.uploadImage(input.files);
        };
    }

    _uploadingImg: any[] = [];

    public uploadImage(files) {
        let formData = new FormData();

        Array.from(files).forEach((file: any, i) => {
            formData.set('images[' + i + ']', file);
        });

        let editorIndex = this.editor.getSelection().index;
        this._uploadingImg.push(this.editor.getSelection().index);

        this.http.post('file/upload/image?bucket=' + (this.ossBucket || Config.buckets.admin), formData).then(ret => {
            ret.forEach(v => {
                this.editor.insertEmbed(this._uploadingImg.shift(), 'image', this.ossPath + v);
            });
            this.editor.setSelection(editorIndex + ret.length);
        }).catch(() => {
            this._uploadingImg.shift();
        });
    }
}
