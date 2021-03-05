public with sharing class ConfigValidator {
    public ConfigurationModel load(
        Id productId,
        QuoteModel quote,
        ConfigurationModel configuration,
        String event,
        String upgradedAssetId) {
    
        ValidatorContext ctx = new ValidatorContext(
            quote,
            configuration,
            event,
            upgradedAssetId);
        String configJSON = SBQQ.ServiceRouter.load('SBQQ.ConfigAPI.ConfigurationValidator', productId, JSON.serialize(ctx));
        return (ConfigurationModel) JSON.deserialize(configJSON, ConfigurationModel.class);
    }
    
    private class ValidatorContext {
        private QuoteModel quote;
        private ConfigurationModel configuration;
        private String event;
        private String upgradedAssetId;
    
        public ValidatorContext(
            QuoteModel quote,
            ConfigurationModel configuration,
            String event,
            String upgradedAssetId) {
    
            this.quote = quote;
            this.configuration = configuration;
            this.event = event;
            this.upgradedAssetId = upgradedAssetId;
        }
    }
}