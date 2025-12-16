const controller = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('custom-csv-import-export-javascript')
      // the name of the service file & the method.
      .service('service')
      .getWelcomeMessage();
  },
});

export default controller;
