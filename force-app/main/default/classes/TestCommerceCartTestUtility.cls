@isTest
public class TestCommerceCartTestUtility {

    public static TestCommerceCart.ProductConfigWrapper CreateTestConfig(ProductModel product)
    {
        TestCommerceCart.ProductConfigWrapper pConfigWrapper = new TestCommerceCart.ProductConfigWrapper();
        // create mock config
        ConfigurationModel configuration = new ConfigurationModel();
		configuration.configuredProductId = product.record.Id;
        configuration.validationMessages = new List<String>();
        configuration.configurationData = new SBQQ__ProductOption__c();
        configuration.optionData = new SBQQ__ProductOption__c();
        configuration.configured = false;
        configuration.priceEditable = false;
        configuration.optionConfigurations = new List<ConfigurationModel>();
        
        pConfigWrapper.ProductModel = product;
        pConfigWrapper.ProductModel.configuration = configuration;
        
        return pConfigWrapper;
    }
    
    public static String CreateTestQuote() {
        SBQQ__Quote__c quote = new SBQQ__Quote__c(SBQQ__Primary__c = true, SBQQ__SubscriptionTerm__c = 12, SBQQ__Status__c = 'Draft', SBQQ__Type__c = 'Quote');
        insert quote;
        System.debug('CREATED TEST QUOTE: ' + quote.Id);
        return quote.Id;
    }
    
    public static String GetProductTestId() {
        return [Select Id from Product2 where Name = 'Test Product 01'].Id;
    }
    
    public static ConnectApi.ProductDetail GetMockCommerceProductDetail()
    {
        ConnectApi.ProductDetail product = new ConnectApi.ProductDetail();
        product.defaultImage = new ConnectApi.ProductMedia();
        product.defaultImage.url = '';

        return product;
    }
}