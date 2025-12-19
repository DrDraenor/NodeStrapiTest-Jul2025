'use strict';

module.exports = ({ strapi }) => ({
  async importHotels(ctx) {
    try {
      const { files, body } = ctx.request;

      if (!files || !files.file) {
        return ctx.badRequest('No file uploaded');
      }

      console.log('Files received:', JSON.stringify(files, null, 2));

      // Handle 'file' (CSV)
      // Note: Strapi/Koa-body might return 'file' as an array if multiple or single object.
      // Usually it's files.file
      let csvFile = files.file;
      if (Array.isArray(csvFile)) csvFile = csvFile[0];

      const filePath = csvFile.filepath || csvFile.path;
      if (!filePath) {
        throw new Error('CSV file path not found in request');
      }

      // Handle images
      let images = files.images || [];
      if (!Array.isArray(images)) images = [images];

      // Filter out empty if any (sometimes happen)
      images = images.filter(img => img && (img.filepath || img.path));

      const stats = await strapi
        .plugin('custom-csv-import-export-javascript')
        .service('importService')
        .importHotels(filePath, images);

      ctx.body = {
        message: 'Import completed successfully',
        stats,
      };
    } catch (err) {
      console.error('Import controller error:', err);
      ctx.throw(500, err.message);
    }
  },
});
