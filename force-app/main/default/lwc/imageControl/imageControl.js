import { LightningElement,api } from 'lwc';

export default class ImageControl extends LightningElement {
    @api url;
    @api altText;
}