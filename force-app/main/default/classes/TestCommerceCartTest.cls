@isTest
public with sharing class TestCommerceCartTest {
    
    @TestSetup
    static void setup(){

        Product2 p = new Product2(
                Name = 'Test Product 01',
                IsActive = true,
                ProductCode = 'TP-01',
                CurrencyIsoCode = 'USD',
            	SBQQ__ConfigurationType__c = 'Allowed'
        );

        Database.insert(p);

        PricebookEntry pbe = new PricebookEntry(
                Product2Id=p.Id,
                CurrencyIsoCode = 'USD',
                IsActive = true,
                Pricebook2Id = Test.getStandardPricebookId(),
                UnitPrice = 100
        );

        Database.insert(pbe);
    }
    
    @isTest
    public static void createQuoteTest() {
        QuoteModel quote = TestCommerceCart.CreateQuote();
        System.assert(quote != null);
    }
    
    @isTest
    public static void getBundleProductsTest() {
        string bundleWrapper = TestCommerceCart.getBundleProducts(null, null);
        System.assert(bundleWrapper.length() > 0);
    }
    
    @isTest
    public static void loadProductConfigTest() {
		string productId = TestCommerceCartTestUtility.GetProductTestId();
        string configWrapper = TestCommerceCart.LoadProductConfig(productId, null, null);
        System.assert(configWrapper.length() > 0);
    }
    
    @isTest
    public static void validateConfigTest() {
        string productId = TestCommerceCartTestUtility.GetProductTestId();
		string wrapperStr = TestCommerceCart.LoadProductConfig(productId, null, null);
        TestCommerceCart.ProductConfigWrapper configWrapper = (TestCommerceCart.ProductConfigWrapper) JSON.deserialize(wrapperStr, TestCommerceCart.ProductConfigWrapper.class);
        ConfigurationModel validatedConfig = TestCommerceCart.ValidateConfig(configWrapper);
        System.assert(validatedConfig != null);
    }
    
    @isTest
    public static void saveToCartTest() {
        string productId = TestCommerceCartTestUtility.GetProductTestId();
		string wrapperStr = TestCommerceCart.LoadProductConfig(productId, null, null);
        String configWrapper = TestCommerceCart.SaveToCart(wrapperStr, null, null);
        System.assert(configWrapper.length() > 0);
    }
    
    @isTest
    public static void productToCartItemTest() {
        string productId = TestCommerceCartTestUtility.GetProductTestId();
        ConnectApi.CartItemInput cartItem = TestCommerceCart.ProductToCartItem(productId, 1);
        System.assertEquals(cartItem.productId, productId);
        System.assertEquals(cartItem.quantity, '1');
    }
    
    @isTest
    public static void getProductImageMapTest() {
        string productId = TestCommerceCartTestUtility.GetProductTestId();
        List<String> pIds = new List<String>();
        pIds.add(productId);
        Map<String, String> imgMap = TestCommerceCart.GetProductImageMap(pIds, null, null);
        System.assert(imgMap.size() > 0);
    }
    
    @isTest
    public static void getProductImageTest() {
        string productId = TestCommerceCartTestUtility.GetProductTestId();
        String imgUrl = TestCommerceCart.GetProductImage(productId, null, null);
        System.assertEquals(imgUrl, '');
    }

}