public with sharing class TestCommerceCart {

    @AuraEnabled
    public static string getBundleProducts(string communityId, string accountId){
        
        Product2[] bundles = [SELECT Id, Name, Family, Description, IsActive, SBQQ__ConfigurationType__c, SBQQ__ConfigurationEvent__c, SBQQ__SortOrder__c FROM Product2 WHERE IsActive = true AND (SBQQ__ConfigurationType__c = 'Allowed' OR SBQQ__ConfigurationType__c = 'Required')];
		List<String> productIds = new List<String>();
        for(Product2 p : bundles)
        {
            productIds.add(p.Id);
        }
        BundleWrapper wrapper = new BundleWrapper();
        wrapper.Bundles = bundles;
        if(Test.isRunningTest()){
            return JSON.serialize(wrapper);
        }
        else{ 
            string webstoreId = getStoreId(communityId);
            wrapper.ProductImageMap = GetProductImageMap(productIds, webstoreId, accountId);
        }
        System.debug(wrapper);
        return JSON.serialize(wrapper);
    }
    
    @AuraEnabled
    public static string LoadProductConfig(string productId, string communityId, string accountId) {
        
		QuoteModel quote = CreateQuote();

        ProductReader productReader = new ProductReader();
        Id pricebookId = getPriceBookId();
		ProductModel product = productReader.read(productId, pricebookId, UserInfo.getDefaultCurrency()); // get currency from company

        LoadRuleRunner runner = new LoadRuleRunner();
        product = runner.load(productId, quote, null, null, product.configuration, null);
        
        ProductConfigWrapper pConfigWrapper = new ProductConfigWrapper();
        
        if(Test.isRunningTest()){
            pConfigWrapper = TestCommerceCartTestUtility.CreateTestConfig(product);
        }
        else{   
            pConfigWrapper.ProductModel = product;
            pConfigWrapper.QuoteId = String.valueOf(quote.record.Id);
            List<String> optionIds = new List<String>();
            if(product.options.size() > 0)
            {
                for(OptionModel o : product.options)
                {
                    optionIds.add(o.record.SBQQ__OptionalSKU__c);
                }
                pConfigWrapper.ProductImageMap = GetProductImageMap(optionIds, getStoreId(communityId), accountId);
            }
        }
                
        System.debug('P CONFIG WRAPPER' + JSON.serialize(pConfigWrapper));

        return JSON.serialize(pConfigWrapper);
    }
    
    @AuraEnabled
    public static string SaveToCart(String wrapperStr, string communityId, string accountId) {
        System.debug('SAVE TO CART wrapper str ' + wrapperStr);
        ProductConfigWrapper configWrapper = (ProductConfigWrapper) JSON.deserialize(wrapperStr, ProductConfigWrapper.class);
        System.debug('SAVE TO CART config wrapper Options' + JSON.serializePretty(configWrapper.ProductModel.configuration.optionConfigurations));
		ConfigurationModel config = configWrapper.ProductModel.configuration;
        // validate config
        config = ValidateConfig(configWrapper);
        configWrapper.ProductModel.configuration = config;
        // if no validation errors, add to cart
        if(config.validationMessages.size() < 1)
        {
			configWrapper = AddConfigToCart(configWrapper, getStoreId(communityId), accountId);   
        }
        return JSON.serializePretty(configWrapper);
    }
    
    /** UTILITY METHODS **/
    
    public static ConfigurationModel ValidateConfig(ProductConfigWrapper pConfigWrapper) {
        
        ConfigurationModel config = pConfigWrapper.ProductModel.configuration;
        //System.debug('config: ' + JSON.serializePretty(config));
        System.debug('options: ' + JSON.serializePretty(config.optionConfigurations));
        string quoteId = pConfigWrapper.QuoteId;
        if(Test.isRunningTest())
        {
            quoteId = TestCommerceCartTestUtility.CreateTestQuote();
        }
        
        QuoteReader qReader = new QuoteReader();
        QuoteModel quote = qReader.read(quoteId);
        ProductReader pReader = new ProductReader();
        ProductModel product = pConfigWrapper.ProductModel;
        ConfigValidator validator = new ConfigValidator();
        
        config = validator.load(config.configuredProductId, quote, config, 'Edit', null);
        System.debug('updated config: ' + JSON.serializePretty(config));
        return config;
    }
    
    public static QuoteModel CreateQuote() {
        SBQQ__Quote__c quote = new SBQQ__Quote__c(SBQQ__Primary__c = true, SBQQ__SubscriptionTerm__c = 12, SBQQ__Status__c = 'Draft', SBQQ__Type__c = 'Quote');
        insert quote;
        QuoteReader reader = new QuoteReader();
        QuoteModel quoteModel = reader.read(quote.Id);
        return quoteModel;
    }
    
    public static ProductConfigWrapper AddConfigToCart(ProductConfigWrapper configWrapper, string webstoreId, string accountId)
    {
        // add bundle product
        ConnectApi.CartItemInput item = ProductToCartItem(configWrapper.ProductModel.configuration.configuredProductId, 1);
        System.debug('PRODUCT TO ADD TO CART ITEM: ' + item);
        configWrapper.CartId = AddToCart(configWrapper, webstoreId, accountId, item);
        // add bundle options
        for(ConfigurationModel cf : configWrapper.ProductModel.configuration.optionConfigurations)
        {
            item = ProductToCartItem(cf.optionData.SBQQ__OptionalSKU__c, Integer.valueOf(cf.optionData.SBQQ__Quantity__c));
            AddToCart(configWrapper, webstoreId, accountId, item);
        }
        return configWrapper;
    }

    public static String AddToCart(ProductConfigWrapper configWrapper, string webstoreId, string accountId, ConnectApi.CartItemInput item)
    {
        if(Test.isRunningTest())
        {
            return '';
        }
        try {
            ConnectApi.CartItem input = ConnectApi.CommerceCart.addItemToCart(webstoreId, accountId, 'active', item);
            return input.CartId;
        }
        catch(Exception e) {
            System.debug('exception!!! w: ' + webstoreId + ' Acc: ' + accountId);
            System.debug(e);
            throw new CustomException('Error adding item to cart!');
        }
    }
    
	public static ConnectApi.CartItemInput ProductToCartItem(string productId, Integer quantity)
    {
        ConnectApi.CartItemInput item = new ConnectApi.CartItemInput();
        
        item.productId = productId;
        item.quantity = String.valueOf(quantity);
        item.type = ConnectApi.CartItemType.Product;
        
        return item;
    }
    
    public static Map<String, String> GetProductImageMap(List<String> productIds, String webstoreId, String accountId)
    {
        Map<String, String> imgMap = new Map<String, String>();
		for(String id : productIds)
        {
            string url = GetProductImage(id, webstoreId, accountId);
            imgMap.put(id, GetBaseUrl() + url);
        }
        return imgMap;
    }
    
    public static string GetProductImage(string productId, string webstoreId, string accountId)
    {
        if(Test.isRunningTest())
        {
            ConnectApi.ProductDetail product = TestCommerceCartTestUtility.GetMockCommerceProductDetail();
	        return product.defaultImage.url;
        } else {
            try
            {
                ConnectApi.ProductDetail product = ConnectApi.CommerceCatalog.getProduct(webstoreId, productId, accountId, null, false, null, false, false, false);
                System.debug('product from Commerce: ' + product);
                return product.defaultImage.url;
            }
            catch(exception e)
            {
                System.debug(e);
            }
            return 'image not found';
        }
    }
    
    public static String getBaseUrl()
    {
        return URL.getOrgDomainUrl().toExternalForm();
    }
 
    public static Id getPriceBookId() {
        if(Test.isRunningTest()) {
            return Test.getStandardPricebookId();
        } else {
            return [SELECT Id, IsStandard FROM Pricebook2 WHERE IsStandard = TRUE LIMIT 1].Id;
        }
    }
    
    public static String getStoreId(String communityId){
        if(communityId == null){
            return null;
        }

        return [SELECT WebStoreId FROM WebStoreNetwork WHERE NetworkId = :communityId LIMIT 1].WebStoreId;
    }
    
    public class ProductConfigWrapper {

        public ProductModel ProductModel {get; set;}
        public String QuoteId {get; set;}
        public String CartId {get; set;}
        public Map<String, String> ProductImageMap {get; set;}
    
        public ProductConfigWrapper() { }
    
    }
    
    public class BundleWrapper {
        public Product2[] Bundles {get; set;}
		public Map<String, String> ProductImageMap {get; set;}
        
        public BundleWrapper() { }
    }
}