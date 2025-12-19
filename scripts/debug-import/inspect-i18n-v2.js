
const strapiLib = require('@strapi/strapi');

async function inspectI18n() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const locService = strapi.plugin('i18n').service('localizations');
        console.log('--- Documentation for localizations service ---');
        for (let prop in locService) {
            if (typeof locService[prop] === 'function') {
                console.log(`Method: ${prop}`);
            }
        }
    } catch (error) {
        console.error('Error inspecting i18n:', error);
    }
    process.exit(0);
}

inspectI18n();
