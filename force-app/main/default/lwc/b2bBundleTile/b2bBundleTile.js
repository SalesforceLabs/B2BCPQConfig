import { LightningElement, api, track } from 'lwc';
import LOGO_Salesforce from '@salesforce/resourceUrl/salesforce_logo';

export default class B2bBundleTile extends LightningElement {
  // salesforceLogo = My_Resource + '/images/SalesforceLogo.png';
  salesforceLogo = LOGO_Salesforce;
  @api
  set product(product) {
    const thisProduct = product;
    this._product = thisProduct;
  }
  get product()     { return this._product; }
  get productName() { return this._product.Name; }
  get productDesc() { return this._product.Description;}
  get productImage() { return this._product.ProductImage;}
  get useStandardImage() {
    let matchingPhrase = 'image not found';
    let condition = this.productImage;
    return condition.match(new RegExp(matchingPhrase))
  }

  @track _product;

  // connectedCallback() { console.log('this.proxyToObj(this._product) :>> ',this.proxyToObj(this._product)); }

  handleBundleSelection() {
    this.dispatchEvent(new CustomEvent('updatebundleselection', { detail: { recordId: this._product.Id, view: "configuration" } } ));
  }

  proxyToObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}