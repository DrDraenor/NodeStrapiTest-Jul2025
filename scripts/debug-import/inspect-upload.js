
const strapiLib = require('@strapi/strapi');

async function inspectUpload() {
    const strapiFactory = strapiLib.createStrapi || strapiLib;

    if (typeof strapiFactory !== 'function') {
        console.error('Could not find Strapi factory function');
        return;
    }

    const strapi = await strapiFactory().load();

    try {
        const uploadService = strapi.plugin('upload').service('upload');
        console.log('Upload Service methods:', Object.keys(uploadService));

        // Try to see the upload method signature or part of it
        if (uploadService.upload) {
            console.log('Upload method length:', uploadService.upload.length);
            // We can't easily toString() because it might be a wrapper
        }
    } catch (error) {
        console.error('Error inspecting upload service:', error);
    }
    process.exit(0);
}

inspectUpload();
