public with sharing class ProductReader { 
    
    public ProductModel read(Id productId, Id pricebookId, String currencyCode) {
        ProductReaderContext ctx = new ProductReaderContext(pricebookId, currencyCode);
        String productJSON = SBQQ.ServiceRouter.load('SBQQ.ProductAPI.ProductLoader', productId, JSON.serialize(ctx));
        return (ProductModel) JSON.deserialize(productJSON, ProductModel.class);
    }
    
    private class ProductReaderContext {
        private Id pricebookId;
        private String currencyCode;
        
        private ProductReaderContext(Id pricebookId, String currencyCode) {
            this.pricebookId = pricebookId;
            this.currencyCode = currencyCode;
        }
    } 
}