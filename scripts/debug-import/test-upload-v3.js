
const strapiLib = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const filePath = path.resolve(__dirname, 'package.json');
        const stats = fs.statSync(filePath);

        console.log('--- TEST: stream ---');
        try {
            const result = await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: {
                    media: {
                        name: 'test-stream.json',
                        getStream: () => fs.createReadStream(filePath), // Some versions use a factory
                        stream: fs.createReadStream(filePath), // Some versions use direct
                        type: 'application/json',
                        size: stats.size
                    }
                }
            });
            console.log('Stream test SUCCESS - ID:', result[0].id);
        } catch (e) {
            console.log('Stream test ERROR:', e.message);
            console.log(e.stack);
        }

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    }
    process.exit(0);
}

testUpload();
