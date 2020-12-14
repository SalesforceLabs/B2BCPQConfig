import { LightningElement, api } from "lwc";


export default class B2bConfigurator extends LightningElement {
  @api effectiveAccountId;
  @api cartBaseURL;
  view = "selection";
  bundleId;
  bundleImage;

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

  get viewSelection() {
    return this.view === "selection";
  }
  get viewConfiguration() {
    return this.view === "configuration";
  }

  connectedCallback() {
    console.log('this.resolvedEffectiveAccountId', this.resolvedEffectiveAccountId);
    console.log('this.cartBaseURL', this.cartBaseURL);
  }

  // handleConfigureBundle(event) {
  //   this.updateView(event);
  //   this.bundleId = event.detail.recordId;
  //   console.log("this.view :>> ", this.view);
  //   console.log("this.bundleId :>> ", this.bundleId);
  // }

  handleConfigureBundleTile(event) {
    this.updateView(event);
    this.bundleId = event.detail.recordId;
    this.bundleImage = event.detail.bundleImage;
    console.log("this.bundleImage :>> ", this.bundleImage);
    // console.log("this.bundleId :>> ", this.bundleId);
  }

  updateView(event) {
    this.view = event.detail.view;
  }

}