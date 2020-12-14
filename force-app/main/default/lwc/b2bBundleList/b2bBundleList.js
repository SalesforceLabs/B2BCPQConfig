import { LightningElement, api, track } from 'lwc';

export default class B2bBundleList extends LightningElement {
  @api
  set products(value) {
      const theseBundles = value.length > 0 ? value : []; 
      this.hasBundles = theseBundles.length > 0;
      this._bundles = this.hasBundles ? theseBundles : [];
  }
  get products() {
      return this._bundles;
  }

  @track hasBundles = false;
  @track _bundles = [];

  handleBundleSelection(event) { this.updateBundleSelection(event); }

  updateBundleSelection(event) {
    const Id = event.detail.recordId || '';
    const view = event.detail.view || 'selection';
    this.dispatchEvent(new CustomEvent('updatebundleselection', { detail: { recordId: Id, view: view } }));
  }

   proxyToObj(obj) { return JSON.parse(JSON.stringify(obj)); }
}