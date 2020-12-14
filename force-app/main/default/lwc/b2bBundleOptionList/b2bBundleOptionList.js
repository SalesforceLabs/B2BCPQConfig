import { LightningElement, api, track } from 'lwc';
import CURRENCY from '@salesforce/i18n/currency';

const columns = [
  { label: '', 
    fieldName: 'ProductImage', 
    initialWidth: 150,
    type:'image',
    cellAttributes: { alignment: 'center' }
  },
  {
    label: 'Name',
    fieldName: 'SBQQ__ProductName__c',
    type: 'text',
    hideDefaultActions: true,
    sortable: true
  },
  {
    label: 'Quantity',
    fieldName: 'SBQQ__Quantity__c',
    type: 'number',
    initialWidth: 100,
    editable: true,
    hideDefaultActions: true,
    cellAttributes: { alignment: 'center' }
  },
  {
    label: 'Description',
    fieldName: 'SBQQ__ProductDescription__c',
    type: 'text',
    wrapText: true,

  },
  {
    label: 'Price',
    fieldName: 'SBQQ__UnitPrice__c',
    type: 'currency',
    initialWidth: 100,
    sortable: true,
    hideDefaultActions: true,
    typeAttributes: { currencyCode: 'USD' },
    cellAttributes: { alignment: 'right' }
  }
];

export default class B2bBundleOptionList extends LightningElement {
  @api options;
  @track columns = columns;
  @track preSelectedRows = [];
  @track sortBy;
  @track sortDirection;

  
  connectedCallback() {
    if (this.options.length > 0) {
      this.setTableCurrency(CURRENCY);
      this.handleDataLoad(this.options);
    }
  }

  handleDataLoad(options) {
    let formattedOptions = this.formatOptions(options);
    let selectedRowsFromConfig = this.setPreSelectedRows(options);
    this.preSelectedRows = selectedRowsFromConfig;
    this.options = formattedOptions;
  }

  handleSortdata(event) {
    this.sortBy = event.detail.fieldName;
    this.sortDirection = event.detail.sortDirection;

    this.sortData(this.sortBy, this.sortDirection);
  }

  sortData(fieldname, direction) {
    let parseData = JSON.parse(JSON.stringify(this.options));
    let keyValue = (a) => { return a[fieldname]; };
    let isReverse = direction === 'asc' ? 1: -1;

    parseData.sort((x, y) => {
      x = keyValue(x) ? keyValue(x) : '';
      y = keyValue(y) ? keyValue(y) : '';

      return isReverse * ((x > y) - (y > x));
    });

    this.options = parseData;
  }

  setPreSelectedRows(options) {
    const theseOptions = options || [];
    let returnIds = [];

    if (theseOptions.length > 0) {
      const selectedRows = theseOptions.filter(option => { return option.SBQQ__Selected__c == true} );
      selectedRows.forEach(row => { returnIds.push(row.Id)})
    }
    return returnIds;
  }


  setTableCurrency(currencyCode) {
    const code = currencyCode || 'USD';
    let cols = this.columns.filter(column => { return column.type == 'currency'});
    cols.map(col => col.typeAttributes.currencyCode = code);
  }
  
  // TODO: add to utility class
  proxyToObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // * Datatable
  callRowSelection(event) {
    const selectedRows = event.detail.selectedRows;
    console.log('selectedRows ---------------> ', this.proxyToObj(selectedRows));
    this.updateSelectedRows(selectedRows);
  }
  // TODO: UPDATE PRODUCT CONFIG ON CHANGE HERE
  handleSave(event) {
    const draftValues = event.detail.draftValues || [];
    console.log('event.detail.draftValues', this.proxyToObj(draftValues));

    this.updateRowQuantities(draftValues);
  }

  // * Communication
  updateSelectedRows(rows) {
    this.dispatchEvent(new CustomEvent('updateselectedrows', {detail: { selectedRows: rows }}));
  }
  updateRowQuantities(rowMap) {
    this.dispatchEvent(new CustomEvent('updaterowquantities', {detail: { rowMap: rowMap }}));
  }

  // * Utils
  formatOptions(options) {
    let opts = options || [];
    if (opts.length > 0) { opts.forEach((opt) => { opt = opt.record; }); }
    return opts;
  }

  
}