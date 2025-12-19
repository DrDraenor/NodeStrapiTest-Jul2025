
const strapiLib = require('@strapi/strapi');

async function testCreateLocale() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        console.log('--- Testing Strapi v5 Document Service Localization ---');

        // 1. Create Base Entry (EN)
        const entry1 = await strapi.documents('api::hotel.hotel').create({
            data: {
                Name: 'Base Entry V5 (EN)',
                Description: 'English Description V5',
            },
            locale: 'en'
        });
        console.log(`Entry 1 - ID: ${entry1.id}, DocumentId: ${entry1.documentId}, Locale: ${entry1.locale}`);

        // 2. Create Localized Entry (ES-CR)
        const entry2 = await strapi.documents('api::hotel.hotel').create({
            data: {
                Name: 'Localized Entry V5 (ES)',
                Description: 'Spanish Description V5',
            },
            locale: 'es-CR',
            documentId: entry1.documentId // Link via documentId
        });
        console.log(`Entry 2 - ID: ${entry2.id}, DocumentId: ${entry2.documentId}, Locale: ${entry2.locale}`);

        // 3. Verify
        const entries = await strapi.documents('api::hotel.hotel').findMany({
            filters: { documentId: entry1.documentId },
            locale: '*' // Get all locales
        });
        console.log(`Total locales found for document ${entry1.documentId}: ${entries.length}`);
        entries.forEach(e => {
            console.log(` - ID: ${e.id}, Locale: ${e.locale}, Name: ${e.Name}`);
        });

        // Cleanup
        await strapi.documents('api::hotel.hotel').delete({ documentId: entry1.documentId });
        console.log('Cleanup done.');
    } catch (error) {
        console.error('Error testing v5 locale creation:', error);
    }
    process.exit(0);
}

testCreateLocale();
