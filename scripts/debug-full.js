
const Strapi = require('@strapi/strapi');
const { Parser } = require('json2csv');
const _ = require('lodash');

async function debugFullService() {
    process.chdir(__dirname + '/..');
    const strapi = await Strapi.createStrapi({}).load();

    try {
        strapi.log.level = 'debug';
        console.log('--- START FULL DEBUG ---');

        const service = {
            getComponentSchema(componentUid) {
                return strapi.components[componentUid];
            },
            flattenEntity(entity, schema, prefix = '') {
                const flattened = {};
                if (!entity) return flattened;

                Object.entries(schema.attributes).forEach(([key, attribute]) => {
                    const fieldName = prefix ? `${prefix}.${key}` : key;
                    const value = entity[key];

                    if (value === undefined || value === null) {
                        flattened[fieldName] = '';
                        return;
                    }

                    switch (attribute.type) {
                        case 'component':
                            if (attribute.repeatable) {
                                flattened[fieldName] = JSON.stringify(value);
                            } else {
                                const componentSchema = this.getComponentSchema(attribute.component);
                                if (componentSchema && value) {
                                    const flattenedComponent = this.flattenEntity(value, componentSchema, fieldName);
                                    Object.assign(flattened, flattenedComponent);
                                }
                            }
                            break;
                        default:
                            flattened[fieldName] = value;
                            break;
                    }
                });
                return flattened;
            }
        };

        // 1. Fetch Locales
        const usedLocales = await strapi.plugin('i18n').service('locales').find();
        const localeCodes = usedLocales.map((l) => l.code);
        console.log('Locales:', localeCodes);

        // 2. Fetch Hotels
        const hotels = await strapi.documents('api::hotel.hotel').findMany({
            populate: '*', // Simple populate
            status: 'draft',
            locale: localeCodes,
        });
        console.log('Hotels Found:', hotels.length);

        // 3. Merge Logic
        const hotelsByDocId = _.groupBy(hotels, 'documentId');
        const mergedHotels = [];
        Object.values(hotelsByDocId).forEach(versions => {
            const enVersion = versions.find(v => v.locale === 'en');
            const esVersion = versions.find(v => v.locale && v.locale.startsWith('es'));
            if (enVersion) {
                const merged = { ...enVersion };
                if (esVersion && esVersion.description) {
                    merged.description_es = esVersion.description;
                } else {
                    merged.description_es = '';
                }
                mergedHotels.push(merged);
            }
        });
        console.log('Merged Hotels:', mergedHotels.length);

        // 4. Flatten
        const schema = strapi.getModel('api::hotel.hotel');
        const flattenedHotels = mergedHotels.map((hotel) => {
            const flat = service.flattenEntity(hotel, schema, '');
            flat['description_es'] = hotel.description_es;
            return flat;
        });
        console.log('Flattened Count:', flattenedHotels.length);

        // 5. CSV
        if (flattenedHotels.length > 0) {
            const fields = Object.keys(flattenedHotels[0]);
            const parser = new Parser({ fields });
            const csv = parser.parse(flattenedHotels);
            console.log('CSV Generated Length:', csv.length);
        }

    } catch (error) {
        console.error('Debug Error:', error);
    }
    strapi.destroy();
    process.exit(0);
}

debugFullService();
