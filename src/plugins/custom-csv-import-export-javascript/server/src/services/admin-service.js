'use strict';

const fs = require('fs');
const csv = require('csv-parser');

module.exports = ({ strapi }) => ({
    async getContentTypes() {
        const contentTypes = strapi.contentTypes;
        return Object.keys(contentTypes)
            .filter(uid => uid.startsWith('api::') && contentTypes[uid].kind === 'collectionType')
            .map(uid => ({
                uid,
                displayName: contentTypes[uid].info.displayName || contentTypes[uid].info.name,
            }));
    },

    async analyzeCsv(filePath) {
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    if (results.length < 5) results.push(data); // Preview first 5
                    else results.push({}); // Just for counting
                })
                .on('end', resolve)
                .on('error', reject);
        });

        return {
            totalEntries: results.length,
            preview: results.slice(0, 5).map(row => row.Name || row.name || row.Title || row.title || 'Unnamed entry'),
        };
    }
});
