const strapiLib = require('@strapi/strapi');

async function inspectI18n() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const i18n = strapi.plugin('i18n');
        const services = Object.keys(i18n.services);
        console.log('--- I18n Services ---');
        services.forEach(s => {
            console.log(`Service: ${s}`);
            console.log(`  Methods: ${Object.keys(i18n.services[s]).join(', ')}`);
        });
    } catch (error) {
        console.error('Error inspecting i18n:', error);
    }
    process.exit(0);
}

inspectI18n();
