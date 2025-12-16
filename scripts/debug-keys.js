
const Strapi = require('@strapi/strapi');

async function debugKeys() {
    process.chdir(__dirname + '/..');
    const strapi = await Strapi.createStrapi({}).load();

    try {
        console.log('--- START KEYS DEBUG ---');
        console.log('Looking for doc: v4vrtm1n1w08dai7cakfxaa5');

        // Need explicit locales
        const allLocales = await strapi.plugin('i18n').service('locales').find();
        const codes = allLocales.map(l => l.code);
        console.log('Querying locales:', codes);

        // Fetch all locales for this doc
        const docs = await strapi.documents('api::hotel.hotel').findMany({
            filters: {
                documentId: 'v4vrtm1n1w08dai7cakfxaa5',
            },
            locale: codes,
            status: 'draft',
        });

        console.log('Found versions:', docs.length);

        docs.forEach(doc => {
            console.log(`\nLocale: ${doc.locale}`);
            console.log('Keys:', Object.keys(doc).sort().join(', '));
            // Check for common variations
            console.log('Values for description-like keys:');
            Object.keys(doc).forEach(key => {
                if (key.toLowerCase().includes('desc')) {
                    console.log(`  ${key}: "${doc[key]}"`);
                }
            });
        });

    } catch (error) {
        console.error('Debug Error:', error);
    }
    strapi.destroy();
    process.exit(0);
}

debugKeys();
