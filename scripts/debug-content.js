
const Strapi = require('@strapi/strapi');

async function debugContent() {
    process.chdir(__dirname + '/..');
    const strapi = await Strapi.createStrapi({}).load();

    try {
        console.log('--- START CONTENT DEBUG ---');

        // Check available locales first
        const locales = await strapi.plugin('i18n').service('locales').find();
        console.log('Registered Locales:', locales.map(l => l.code));

        // Try draft
        const draftDocs = await strapi.documents('api::hotel.hotel').findMany({
            locale: locales.map(l => l.code),
            status: 'draft',
        });
        console.log('Draft Docs:', draftDocs.length);
        draftDocs.forEach(doc => {
            console.log(`[Draft] ID: ${doc.documentId}, Locale: ${doc.locale}, Desc: ${doc.Description || doc.description}`);
            console.log('Keys:', Object.keys(doc).join(', '));
        });

        // Try published
        const pubDocs = await strapi.documents('api::hotel.hotel').findMany({
            locale: locales.map(l => l.code),
            status: 'published',
        });
        console.log('Published Docs:', pubDocs.length);
        pubDocs.forEach(doc => {
            console.log(`[Published] ID: ${doc.documentId}, Locale: ${doc.locale}, Desc: ${doc.Description || doc.description}`);
        });

    } catch (error) {
        console.error('Debug Error:', error);
    }
    strapi.destroy();
    process.exit(0);
}

debugContent();
