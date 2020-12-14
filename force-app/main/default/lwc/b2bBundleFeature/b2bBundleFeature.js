import { LightningElement, api } from 'lwc';

export default class B2bBundleFeature extends LightningElement {
  @api feature;
  @api options = [];

  get featureName()         { return this.feature.record.Name || ''; }
  get optionsExist()        { return (this.options.length > 0) ? true : false; }
  get thisFeatureOptions()  { return this.prepareOptions(); }
  get featureOptionsExist() { return (this.thisFeatureOptions.length > 0) ? true : false; }

  prepareOptions() {
    let matchedOptions = this.matchOptions(this.options)
    let formattedOptions = this.formatOptions(matchedOptions);
    return [...formattedOptions];
  }
  matchOptions(options) { 
    return options.filter(opt => { return opt.record.SBQQ__Feature__c == this.feature.record.Id}) 
  }
  formatOptions(options) {
    return options.map(option => {return {...option.record}});
  }

  handleRowUpdate(event) {
    const selectedRows = event.detail.selectedRows;
    this.updateSelectedRows(selectedRows);
  }
  updateSelectedRows(rows) {
    this.dispatchEvent(new CustomEvent('updateselectedrows', {detail: { selectedRows: rows } } ));
  }  

  handleRowQuantities(event) {
    const rowMap = event.detail.rowMap;
    this.updateRowQuantities(rowMap);
  }
  updateRowQuantities(rowMap) {
    this.dispatchEvent(new CustomEvent('updaterowquantities', {detail: { rowMap: rowMap }}));
  }

}