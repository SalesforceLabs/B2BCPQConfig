import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getBundles from "@salesforce/apex/TestCommerceCart.getBundleProducts";
import COMMUNITY_ID from '@salesforce/community/Id';

const productColumns = [
  { label: "Name", fieldName: "Name" },
  { label: "Family", fieldName: "Family", initialWidth: 200 },
  { label: "Description", fieldName: "Description" },
  {
    type: "button",
    typeAttributes: {
      label: "Build",
      name: "Build",
      variant: "base",
      title: "Build",
      disabled: false,
      value: "build"
    },
    initialWidth: 150,
    cellAttributes: { alignment: "right" }
  }
];

export default class B2bBundleSelection extends LightningElement {
  productColumns = productColumns;
  @track products = [];
  loading = true;
  bundleImageMap;

  get bundlesExist() { return this.products.length > 0; }
  get bundleList() { return this.products; }
  get messageNoBundles() { return "Hmmm... we weren't able to find any bundles. If you were expecting to see bundles, please contact your system administrator." }

  connectedCallback() {
    this.loadingHandler();
    getBundles({communityId: COMMUNITY_ID}).then(result => { 
      console.log('TestCommerce.getBundleProducts() :>> ', JSON.parse(result));
      this.handleDataLoad(result);
    })
    .catch(error => {
      this.loadedHandler();
      console.error(error);
      this.dispatchEvent(new ShowToastEvent({ title: 'This can\'t be right...', message: 'There\'s no data!', variant: 'error' }))
    })
  }

  handleDataLoad(result) {
    const thisResult = JSON.parse(result);
    const theseBundles = thisResult.Bundles;
    this.bundleImageMap = thisResult.ProductImageMap

    if (theseBundles.length > 0) { 
      this.products = theseBundles.map(bundle => { bundle.ProductImage = this.bundleImageMap[bundle.Id]; return bundle});
    } 
    else if (theseBundles.length == 0) {
      this.products = [];
    }
    this.loadedHandler();
  }
 
  sendBundleConfigTile(event) {
    const Id = event.detail.recordId || '';
    const bundleImage = this.bundleImageMap[Id];
    console.log('bundleImage :>> ', bundleImage);
    const view = event.detail.view || 'selection';
    this.dispatchEvent(new CustomEvent('updatebundleselection', {detail: { recordId: Id, view: view, bundleImage: bundleImage} }));
  }

  loadingHandler() { this.loading = true; }
  loadedHandler() { this.loading = false; }

  proxyToObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}