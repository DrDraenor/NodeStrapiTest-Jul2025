
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
        console.log('--- Testing Strapi v5 Media Upload ---');

        // Find a real file to upload (the script itself or some other file)
        const filePath = path.resolve(__dirname, 'package.json');
        const stats = fs.statSync(filePath);

        // Test 1: With 'path' (what failed)
        try {
            console.log('Testing with path...');
            await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: {
                    media: {
                        name: 'test-path.json',
                        path: filePath,
                        type: 'application/json',
                        size: stats.size
                    }
                }
            });
            console.log('Path test SUCCESS');
        } catch (e) {
            console.log('Path test FAILED:', e.message);
        }

        // Test 2: With 'filepath' (v5 style)
        try {
            console.log('Testing with filepath...');
            await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: {
                    media: {
                        name: 'test-filepath.json',
                        filepath: filePath,
                        type: 'application/json',
                        size: stats.size
                    }
                }
            });
            console.log('Filepath test SUCCESS');
        } catch (e) {
            console.log('Filepath test FAILED:', e.message);
        }

    } catch (error) {
        console.error('Error testing upload:', error);
    }
    process.exit(0);
}

testUpload();
