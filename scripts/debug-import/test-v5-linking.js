
const strapiLib = require('@strapi/strapi');

async function testLinking() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;
    const strapi = await strapiFactory().load();

    try {
        console.log('--- Testing V5 Linking ---');

        // 1. Create Base (EN)
        const enEntry = await strapi.documents('api::hotel.hotel').create({
            data: {
                Name: 'Linking Test Hotel',
                Description: 'English Text'
            },
            locale: 'en',
            status: 'published'
        });
        console.log(`EN Entry DocumentId: ${enEntry.documentId}, ID: ${enEntry.id}`);

        // 2. Try to add ES via update
        console.log('Testing ES via update...');
        const esEntry = await strapi.documents('api::hotel.hotel').update({
            documentId: enEntry.documentId,
            data: {
                Name: 'Linking Test Hotel',
                Description: 'Spanish Text (Updated)'
            },
            locale: 'es-CR',
            status: 'published'
        });
        console.log(`ES Entry DocumentId: ${esEntry.documentId}, ID: ${esEntry.id}`);

        // 3. Verify via findMany with locale: '*'
        const allVersions = await strapi.documents('api::hotel.hotel').findMany({
            filters: { documentId: enEntry.documentId },
            locale: '*'
        });
        console.log(`Versions found: ${allVersions.length}`);
        allVersions.forEach(v => {
            console.log(` - ID: ${v.id}, Locale: ${v.locale}, DocID: ${v.documentId}`);
        });

        if (allVersions.length === 2) {
            console.log('SUCCESS: Versions are linked programmatically.');
        } else {
            console.log('FAILURE: Versions are NOT linked.');
        }

        // Cleanup
        await strapi.documents('api::hotel.hotel').delete({ documentId: enEntry.documentId });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Error testing linking:', error);
    }
    process.exit(0);
}

testLinking();
