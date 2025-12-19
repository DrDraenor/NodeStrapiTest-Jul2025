
const strapiLib = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.resolve(__dirname, 'upload-debug.txt');
function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

async function testUpload() {
    fs.writeFileSync(LOG_FILE, '--- UPLOAD DEBUG ---\n');
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const filePath = path.resolve(__dirname, 'package.json');
        const stats = fs.statSync(filePath);

        log('Testing Stream approach...');
        try {
            const result = await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: {
                    media: {
                        name: 'test-stream.json',
                        stream: fs.createReadStream(filePath),
                        type: 'application/json',
                        size: stats.size
                    }
                }
            });
            log('SUCCESS: ' + JSON.stringify(result[0].id));
        } catch (e) {
            log('ERROR: ' + e.message);
            log('STACK: ' + e.stack);
        }

    } catch (error) {
        log('CRITICAL ERROR: ' + error.message);
    }
    process.exit(0);
}

testUpload();
