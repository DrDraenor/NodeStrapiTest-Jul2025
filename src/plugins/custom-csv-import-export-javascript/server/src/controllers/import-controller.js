'use strict';

module.exports = ({ strapi }) => ({
  async importData(ctx) {
    try {
      const { files, body } = ctx.request;
      const { contentTypeUid, status } = body;
      const { user } = ctx.state;
      console.log('Import Data request by user:', user ? `${user.username || user.email} (ID: ${user.id})` : 'No user in state');

      if (!contentTypeUid) return ctx.badRequest('Content type UID is required');
      if (!files || !files.file) return ctx.badRequest('No CSV file uploaded');

      let csvFile = files.file;
      if (Array.isArray(csvFile)) csvFile = csvFile[0];

      const filePath = csvFile.filepath || csvFile.path;
      let images = files.images || [];
      if (!Array.isArray(images)) images = [images];
      images = images.filter(img => img && (img.filepath || img.path));

      const stats = await strapi
        .plugin('custom-csv-import-export-javascript')
        .service('importService')
        .importData(contentTypeUid, filePath, images, { status, user });

      ctx.body = { message: 'Import completed', stats };
    } catch (err) {
      console.error('Import controller error:', err);
      ctx.throw(500, err.message);
    }
  },

  async importSummary(ctx) {
    try {
      const { files } = ctx.request;
      if (!files || !files.file) return ctx.badRequest('No CSV file uploaded');

      let csvFile = files.file;
      if (Array.isArray(csvFile)) csvFile = csvFile[0];
      const filePath = csvFile.filepath || csvFile.path;

      const summary = await strapi
        .plugin('custom-csv-import-export-javascript')
        .service('adminService')
        .analyzeCsv(filePath);

      ctx.body = { data: summary };
    } catch (err) {
      ctx.throw(500, err.message);
    }
  }
});
