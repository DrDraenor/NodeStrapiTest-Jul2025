
const strapiLib = require('@strapi/strapi');
console.log('Strapi Lib Export keys:', Object.keys(strapiLib));

async function listLocales() {
    // Try to find the factory function
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();
    try {
        const locales = await strapi.plugin('i18n').service('locales').find();
        console.log('Available Locales:', JSON.stringify(locales, null, 2));
    } catch (error) {
        console.error('Error fetching locales:', error);
    }
    process.exit(0);
}

listLocales();
