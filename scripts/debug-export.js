
const Strapi = require('@strapi/strapi');

async function debugExport() {
    // Ensure we start from app root
    process.chdir(__dirname + '/..');

    const strapi = await Strapi.createStrapi({}).load();
    try {
        strapi.log.level = 'debug';
        console.log('--- START DEBUG ---');

        // 1. Check Schema
        const schema = strapi.getModel('api::hotel.hotel');
        console.log('Schema exists:', !!schema);

        if (schema) {
            // 2. Try simple findMany using Document Service V5 specific API if available
            // Note: in V5 strapi.documents is the way
            if (strapi.documents) {
                const docs = await strapi.documents('api::hotel.hotel').findMany({
                    locale: 'es-CR', // Try explicit locale
                    status: 'draft',
                });
                console.log(`findMany(locale="es-CR") count: ${docs.length}`);

                // Test A: Array of locales
                const arrayLocalesDocs = await strapi.documents('api::hotel.hotel').findMany({
                    locale: ['en', 'es-CR'],
                    status: 'draft',
                });
                console.log(`findMany(locale=['en', 'es-CR']) count: ${arrayLocalesDocs.length}`);

                // Test B: Null (maybe allows all?)
                try {
                    const nullLocaleDocs = await strapi.documents('api::hotel.hotel').findMany({
                        locale: null,
                        status: 'draft',
                    });
                    console.log(`findMany(locale=null) count: ${nullLocaleDocs.length}`);
                } catch (e) { console.log('locale=null failed'); }

                // Test C: Wildcard in populate? No, findMany level.

                if (arrayLocalesDocs.length > 0) {
                    console.log('Array Docs Locales:', arrayLocalesDocs.map(d => d.locale));
                }
                const allDocs = await strapi.documents('api::hotel.hotel').findMany({
                    locale: 'all', // Try global
                    status: 'draft',
                });
                console.log(`findMany(locale="all") count: ${allDocs.length}`);

                if (allDocs.length > 0) {
                    console.log('Sample Doc Locales:', allDocs.map(d => d.locale));
                }
            } else {
                console.log('strapi.documents is not available?');
            }
        }

    } catch (error) {
        console.error('Debug Error:', error);
    }
    strapi.destroy();
    process.exit(0);
}

debugExport();
