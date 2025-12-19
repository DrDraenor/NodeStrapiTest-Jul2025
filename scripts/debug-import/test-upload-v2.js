
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

        console.log('--- TEST 1: path ---');
        try {
            await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: { media: { name: 't1.json', path: filePath, type: 'application/json', size: stats.size } }
            });
            console.log('TEST 1 OK');
        } catch (e) {
            console.log('TEST 1 ERROR:', e.message);
        }

        console.log('--- TEST 2: filepath ---');
        try {
            await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: { media: { name: 't2.json', filepath: filePath, type: 'application/json', size: stats.size } }
            });
            console.log('TEST 2 OK');
        } catch (e) {
            console.log('TEST 2 ERROR:', e.message);
        }

        console.log('--- TEST 3: tmpPath ---');
        try {
            await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: { media: { name: 't3.json', tmpPath: filePath, type: 'application/json', size: stats.size } }
            });
            console.log('TEST 3 OK');
        } catch (e) {
            console.log('TEST 3 ERROR:', e.message);
        }

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    }
    process.exit(0);
}

testUpload();
