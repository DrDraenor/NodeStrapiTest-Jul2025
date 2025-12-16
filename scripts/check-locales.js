
const Strapi = require('@strapi/strapi');

async function checkLocales() {
    const strapi = await Strapi.createStrapi({ distDir: './dist' }).load();
    try {
        const locales = await strapi.plugin('i18n').service('locales').find();
        console.log('Available Locales:', JSON.stringify(locales, null, 2));
    } catch (error) {
        console.error('Error fetching locales:', error);
    }
    process.exit(0);
}

checkLocales();
