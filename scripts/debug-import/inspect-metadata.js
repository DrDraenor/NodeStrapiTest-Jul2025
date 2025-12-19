
const strapiLib = require('@strapi/strapi');

async function inspectMetadata() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const metadata = strapi.db.metadata.get('api::hotel.hotel');
        console.log('--- Hotel Metadata attributes ---');
        console.log(Object.keys(metadata.attributes));

        if (metadata.attributes.localizations) {
            console.log('Localizations attribute:', JSON.stringify(metadata.attributes.localizations, null, 2));
        }
    } catch (error) {
        console.error('Error inspecting metadata:', error);
    }
    process.exit(0);
}

inspectMetadata();
