
const strapiLib = require('@strapi/strapi');

async function inspectHotels() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const hotels = await strapi.entityService.findMany('api::hotel.hotel', {
            populate: ['localizations'],
        });
        console.log('--- Recent Hotels ---');
        hotels.slice(-5).forEach(h => {
            console.log(`ID: ${h.id}, Name: ${h.Name}, Locale: ${h.locale}, Localizations: ${JSON.stringify(h.localizations.map(l => l.id))}`);
        });
    } catch (error) {
        console.error('Error inspecting hotels:', error);
    }
    process.exit(0);
}

inspectHotels();
