import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // Register permissions for the plugin
  strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: 'plugins',
      displayName: 'Export Hotels',
      uid: 'export.hotels',
      pluginName: 'custom-csv-import-export',
    },
  ]);
};

export default register;
