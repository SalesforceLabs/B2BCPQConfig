import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import COMMUNITY_ID from '@salesforce/community/Id';
import My_Resource from '@salesforce/resourceUrl/salesforce_logo';
import APEX_SaveToCart from '@salesforce/apex/TestCommerceCart.SaveToCart';
import LoadProductConfig from '@salesforce/apex/TestCommerceCart.LoadProductConfig';
import { loadStyle } from 'lightning/platformResourceLoader';
import b2bbundlestyle from '@salesforce/resourceUrl/b2bbundlestyle'

export default class B2bBundleConfigurator extends LightningElement {
  @api bundleId;
  @api bundleImage;
  @api cartId;
  @api effectiveAccountId;
  @api cartBaseURL;
  @track configStateAttributes = { QuoteId: '', WebStoreId: '', AccountId: ''};
  @track initialProductConfig = {};
  @track currentProductConfig = {};
  @track initialWrapper = {};
  @track features = [];
  @track options = [];
  @wire(CurrentPageReference)
  pageRef;
  
  message;
  loading = true;
  modalHeader = 'Where next?';
  salesforceLogo = My_Resource;

  get resolvedEffectiveAccountId() {
    const effectiveAccountId = this.effectiveAccountId || '';
    let resolved = null;

    if (
      effectiveAccountId.length > 0 &&
      effectiveAccountId !== '000000000000000'
    ) {
      resolved = effectiveAccountId;
    }

    return resolved;
  }
  get bundleProductName() {
    return this.bundleName;
  }
  get featuresExist() {
    return this.features.length > 0;
  }
  get messageNoFeatures() {
    return "Hmmm... this bundle doesn't seem to have any features. If you were expecting to see features and options, please contact your system administrator."
  }

  connectedCallback() { this.handleDataLoad(); loadStyle(this, b2bbundlestyle) }

  //* Data Load
  handleDataLoad() {
    this.loadingHandler();
    LoadProductConfig({
      productId: this.bundleId,
      communityId: COMMUNITY_ID,
      accountId: this.resolvedEffectiveAccountId
    }).then((result) => {
      this.initVariables(result);
      this.loadedHandler();
      this.currentProductConfig = this.initialProductConfig;
      this.initialWrapper = JSON.parse(result);
      // console.log('INITIAL CONFIG: ', JSON.parse(result));
    });
  }
  initVariables(json) {
    const parsedResponse = JSON.parse(json);
    console.log('parsedResponse :>> ', parsedResponse);
    
    const theseImages = parsedResponse.ProductImageMap;
    this.initialProductConfig = parsedResponse.ProductModel;
    this.features = this.initialProductConfig.features;
    let theseOptions = this.initialProductConfig.options;
    let mappedOptions = theseOptions.map(option => { option.record.ProductImage = theseImages[option.record.SBQQ__OptionalSKU__c]; return option});
    this.options = mappedOptions;
    this.bundleName = this.initialProductConfig.record.Name;
    this.configStateAttributes.QuoteId = parsedResponse.QuoteId;
    this.configStateAttributes.WebStoreId = parsedResponse.WebStoreId;
  }

  //* DataTable Actions
  handleBundleCancel() {
    this.updateView('selection');
  }
  handleBundleSave() {
    this.loadingHandler();
    this.initialWrapper.ProductModel = this.currentProductConfig;
    console.log('Calling apex save with: ', this.proxyToObj(this.initialWrapper.ProductModel));
    // console.log('Option Configs: ',JSON.stringify(this.initialWrapper.ProductModel.configuration.optionConfigurations));
    APEX_SaveToCart({wrapperStr: JSON.stringify(this.initialWrapper), communityId: COMMUNITY_ID, accountId: this.resolvedEffectiveAccountId})
    .then((result) => {
      this.loadedHandler();
      // console.log('Save to cart response: ', JSON.parse(result));
      const thisResult = JSON.parse(result);
      const messages = thisResult.ProductModel.configuration.validationMessages;
      const messagesCount = messages.length;
      this.cartId = thisResult.CartId || '';
      
      if (messagesCount === 0) { 
        this.showToast('Success', 'Valid Configuration', 'success'); 
        this.handleShowModal(); } 
      else if (messagesCount > 0)   { 
        let validationStr = '';
        messages.forEach(message => { 
          const thisMessage = message + '\n';
          validationStr += thisMessage;
        });
        this.showToast('Invalid Configuration', validationStr, 'error', 'sticky'); 
      }
    })
    .catch((error) => {
      this.loadedHandler();
      console.log('APEX -- Validate Configuration Error.', error);
      this.showToast('Error', 'Server Error', 'error');
    });
  }

  handleRowUpdate(event) {
    const selectedRows = event.detail.selectedRows;
    const rowsAreSelected = selectedRows.length > 0;

    if (!rowsAreSelected) { console.log('no rows'); } 
    else if (rowsAreSelected) {
      const feature = selectedRows.length > 0 ? event.detail.selectedRows[0].SBQQ__Feature__c : '';
      let optionConfigurations = this.currentProductConfig.configuration.optionConfigurations;
      let selectedRowsMapped = selectedRows.map((x) => { return this.instantiateWrapperClass2(x); });
      let matchFeatureNo  = optionConfigurations.filter(option => { return option.optionData.SBQQ__Feature__c !== feature; });
      let mergedOptions = [...matchFeatureNo, ...selectedRowsMapped];

      //* Build new Config
      let configCloneNew = this.currentProductConfig;
      configCloneNew.configuration.optionConfigurations = mergedOptions;
      let configCloneSelected = this.updateOptionSelectedField(configCloneNew, mergedOptions);
      this.currentProductConfig = configCloneSelected;
      console.log('this.currentProductConfig :>> ', this.proxyToObj(this.currentProductConfig));
    }
  }

  handleRowQuantities(event) {
    const rowMap = event.detail.rowMap;
    this.updateRowQuantities(rowMap);
  }
  updateRowQuantities(rowMap) {
    const thisRowMap = rowMap || [];
    
    if (thisRowMap.length > 0) {
      thisRowMap.forEach(row => {
        const matchedRow = this.currentProductConfig.configuration.optionConfigurations.find(optionConfig => {return optionConfig.optionData.Id == row.Id }) || undefined;
        if (matchedRow != undefined) { console.log('processed row'); matchedRow.optionData.SBQQ__Quantity__c = row.SBQQ__Quantity__c }
      });
    }
  }

  //* Current Config
  buildCurrentConfig(config, options) {
    let configWithOptions = this.addOptionsToConfig(config, options);
    let updatedConfig = this.updateOptionSelectedField(configWithOptions, options );
    return updatedConfig;
  }
  updateOptionSelectedField(config, options) {
    options.forEach((selectOptionsVal) => {
      let configOptionsMatch = config.options.find((configOption) => { return configOption.optionData.Id == selectOptionsVal.Id; });
      if (configOptionsMatch) { configOptionsMatch.record.SBQQ__Selected__c = true; }
    });
    return config;
  }
  addOptionsToConfig(config, options) {
    let objOptions = options.map((x) => { return this.instantiateWrapperClass(x); });
    config.configuration.optionConfigurations = objOptions;
    return config;
  }

  //* Modal Actions
  handleShowModal() {
    const modal = this.template.querySelector(
      'c-b2b-configurator-confirmation'
    );
    console.log(modal);
    modal.show();
  }
  handleContinueShopping() {
    this.closeModal();
    this.updateView('selection');
  }
  closeModal() {
    const modal = this.template.querySelector(
      'c-b2b-configurator-confirmation'
    );
    modal.hide();
  }
  handleViewCart() {
    this.closeModal();
    const uri = window.location.href;
    const dir = "/s/";
    const cleanURL = uri.substring(0, uri.lastIndexOf(dir) + dir.length);

    window.open(cleanURL + this.cartBaseURL + '/' + this.cartId, '_self');
  }

  //* Utility Classes
  proxyToObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  loadingHandler() {
    this.loading = true;
  }
  loadedHandler() {
    this.loading = false;
    console.log('loaded');
  }
  updateView(view) {
    const thisView = view || 'selection';
    this.dispatchEvent(
      new CustomEvent('updateview', { detail: { view: thisView } })
    );
  }
  intersection(arr1, arr2, matchribute) {
    // console.log('arr1 :>> ', arr1);
    // console.log('arr2 :>> ', arr2);
    // console.log('matchribute :>> ', matchribute);
    return arr1.filter((item) => {
      // console.log('item.record[matchribute] :>> ', item.record[matchribute]);
      return arr2.find((val) => {
        // console.log('val[matchribute] :>> ', val[matchribute]);
        return val[matchribute] == item.record[matchribute];
      });
    });
  }
  showToast(title, message, variant, mode) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title || 'no title provided',
        message: message || 'message empty',
        variant: variant,
        // mode: mode || 'dismissable'
      })
    );
  }
  instantiateWrapperClass(option) {
    const wrapper = {
      validationMessages: [],
      priceEditable: false,
      optionId: option['record']['Id'] || null,
      optionData: this.wrapOptionData(option['record']) || {},
      optionConfigurations: [],
      listPrice: null,
      isUpgrade: false,
      isDynamicOption: false,
      inheritedConfigurationData: null,
      hiddenOptionIds: null,
      dynamicOptionKey: null,
      disabledOptionIds: null,
      configuredProductId: option['record']['SBQQ__OptionalSKU__c'] || null,
      configured: false,
      configurationData: { attributes: { type: 'SBQQ__ProductOption__c' } },
      changedByProductActions: false
    };
    return wrapper;
  }
  instantiateWrapperClass2(option) {
    const wrapper = {
      validationMessages: [],
      priceEditable: false,
      optionId: option['Id'] || null,
      optionData: this.wrapOptionData(option) || {},
      optionConfigurations: [],
      listPrice: null,
      isUpgrade: false,
      isDynamicOption: false,
      inheritedConfigurationData: null,
      hiddenOptionIds: null,
      dynamicOptionKey: null,
      disabledOptionIds: null,
      configuredProductId: option['SBQQ__OptionalSKU__c'] || null,
      configured: false,
      configurationData: { attributes: { type: 'SBQQ__ProductOption__c' } },
      changedByProductActions: false
    };
    return wrapper;
  }
  wrapOptionData(record) {
    const wrapper = {
      attributes: {
        type: record['attributes']['type'],
        url: record['attributes']['url']
      },
      SBQQ__Quantity__c: record['SBQQ__Quantity__c'] || null,
      SBQQ__AppliedImmediately__c: record['SBQQ__AppliedImmediately__c'] || false,
      SBQQ__ProductDescription__c: record['SBQQ__ProductDescription__c'] || null,
      SBQQ__QuantityEditable__c: record['SBQQ__QuantityEditable__c'] || false,
      SBQQ__DiscountedByPackage__c: record['SBQQ__DiscountedByPackage__c'] || false,
      SBQQ__Type__c: record['SBQQ__Type__c'] || null,
      SBQQ__ConfiguredSKU__c: record['SBQQ__ConfiguredSKU__c'] || null,
      SBQQ__ProductName__c: record['SBQQ__ProductName__c'] || null,
      OwnerId: record['OwnerId'] || null,
      SBQQ__Required__c: record['SBQQ__Required__c'] || false,
      SBQQ__ProductFamily__c: record['SBQQ__ProductFamily__c'] || null,
      SBQQ__Selected__c: record['SBQQ__Selected__c'] || false,
      SBQQ__PriceEditable__c: record['SBQQ__PriceEditable__c'] || false,
      IsDeleted: record['IsDeleted'] || false,
      SBQQ__Feature__c: record['SBQQ__Feature__c'] || null,
      SBQQ__UpliftedByPackage__c: record['SBQQ__UpliftedByPackage__c'] || false,
      SBQQ__Bundled__c: record['SBQQ__Bundled__c'] || false,
      CurrencyIsoCode: record['CurrencyIsoCode'] || null,
      SBQQ__Number__c: record['SBQQ__Number__c'] || null,
      SystemModstamp: record['SystemModstamp'] || null,
      Id: record['Id'] || null,
      SBQQ__OptionalSKU__c: record['SBQQ__OptionalSKU__c'] || null,
      SBQQ__ProductCode__c: record['SBQQ__ProductCode__c'] || null,
      SBQQ__System__c: record['SBQQ__System__c'] || false
    };
    return wrapper;
  }
}