
const strapiLib = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.resolve(__dirname, 'upload-metadata-debug.txt');
function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

async function testUploadMetadata() {
    fs.writeFileSync(LOG_FILE, '--- UPLOAD METADATA DEBUG ---\n');
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const filePath = path.resolve(__dirname, 'package.json');
        const stats = fs.statSync(filePath);

        log('Testing refined property names (v5 style)...');
        try {
            const result = await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: [
                    {
                        originalFilename: 'test-metadata-v5.json', // Instead of name
                        mimetype: 'application/json',            // Instead of type
                        size: stats.size,
                        filepath: filePath
                    }
                ]
            });
            log('SUCCESS: ID ' + result[0].id + ', Name: ' + result[0].name + ', MIME: ' + result[0].mime);
        } catch (e) {
            log('ERROR: ' + e.message);
            log('STACK: ' + e.stack);
        }

    } catch (error) {
        log('CRITICAL ERROR: ' + error.message);
    }
    process.exit(0);
}

testUploadMetadata();
