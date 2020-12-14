import { LightningElement, api } from 'lwc';

export default class B2bBundleFeatureList extends LightningElement {
  @api featuresList = [];
  @api options = [];
  
  get featuresExist() { return (this.featuresList.length > 0) ? true : false; }
  get optionList() { return this.options; }

  handleRowUpdate(event) {
    const selectedRows = event.detail.selectedRows;
    this.updateSelectedRows(selectedRows);
  }
  updateSelectedRows(rows) {
    this.dispatchEvent(new CustomEvent('updateselectedrows', { detail: { selectedRows: rows } } ));
  }

  handleRowQuantities(event) {
    const rowMap = event.detail.rowMap;
    this.updateRowQuantities(rowMap);
  }
  updateRowQuantities(rowMap) {
    this.dispatchEvent(new CustomEvent('updaterowquantities', {detail: { rowMap: rowMap }}));
  }
}