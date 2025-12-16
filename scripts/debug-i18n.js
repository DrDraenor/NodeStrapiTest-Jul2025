
const Strapi = require('@strapi/strapi');

async function debugI18n() {
    // Ensure we start from app root
    process.chdir(__dirname + '/..');

    const strapi = await Strapi.createStrapi({}).load();
    try {
        strapi.log.level = 'debug';
        console.log('--- START DEBUG I18N ---');

        // Check if i18n plugin exists
        const i18nPlugin = strapi.plugin('i18n');
        console.log('i18n plugin found:', !!i18nPlugin);

        if (i18nPlugin) {
            // Try to get the service
            // Note: In Strapi v4/v5, standard plugins often expose services.
            // i18n usually has a 'locales' service.
            const localesService = i18nPlugin.service('locales');
            console.log('locales service found:', !!localesService);

            if (localesService) {
                const locales = await localesService.find();
                console.log('Locales found:', JSON.stringify(locales, null, 2));
            } else {
                console.log('Services available:', Object.keys(strapi.plugins['i18n'].services));
            }
        } else {
            console.log('Plugins available:', Object.keys(strapi.plugins));
        }

    } catch (error) {
        console.error('Debug Error:', error);
    }
    strapi.destroy();
    process.exit(0);
}

debugI18n();
