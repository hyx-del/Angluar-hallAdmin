
declare var Quill: any;
const BaseBlock = Quill.import('blots/block/embed');
export class ProductBlot extends BaseBlock {
    static blotName = "product";
    static className = 'ql-product-block';
    static tagName = 'div';
    static create(data) {
        const node = super.create();

        node.innerHTML = getProductHtml(data);

        node.setAttribute("data-id", data.item_id);
        node.setAttribute("data-product_name", data.name);
        node.setAttribute("data-price", data.price);
        node.setAttribute("data-thumb_url", data.thumb_url);
        node.setAttribute('contenteditable', "false");
        // node.classList.add("ql-product-block");
        return node;
    }

    static value(domNode) {
        const { id, product_name, price, thumb_url } = domNode.dataset;
        return { id, product_name, price, thumb_url };
    }

    index() {
        return 1;
    }
    
}

export function getProductHtml(data: any) {
    return `
        <div class="image-box">
            <img src="${data.thumb_url}" alt="" />
        </div>
        <div class="product-info">
            <div class="name">${data.product_name || data.name}</div>
            <div class="price">￥${data.price}</div>
            <div class="buy-btn">立即购买</div>
        </div>
    `;
}