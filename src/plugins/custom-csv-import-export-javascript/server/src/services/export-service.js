import { Parser } from 'json2csv';
import _ from 'lodash';

const exportService = ({ strapi }) => ({
    /**
     * Export all hotels to CSV format with flattened components
     */
    async exportHotels() {
        try {
            // Get the hotel schema
            const schema = strapi.getModel('api::hotel.hotel');

            if (!schema) {
                throw new Error('Hotel content type not found');
            }

            strapi.log.info('Export: Schema found, building populate object');

            // Build populate object for deep population
            const populate = this.buildPopulateObject(schema);

            strapi.log.info('Export: Populate object created');

            // Fetch all available locales to query them
            const usedLocales = await strapi.plugin('i18n').service('locales').find();
            const localeCodes = usedLocales.map((l) => l.code);
            strapi.log.info(`Export: Querying for locales: ${localeCodes.join(', ')}`);

            // Fetch hotels using Strapi v5 Document Service or fallbacks
            let hotels = [];
            try {
                if (strapi.documents) {
                    hotels = await strapi.documents('api::hotel.hotel').findMany({
                        populate: populate,
                        status: 'draft',
                        locale: localeCodes, // Use dynamic array of locales
                    });
                    strapi.log.info(`Export: Used strapi.documents API with locales: ${localeCodes.join(', ')}`);
                } else {
                    hotels = await strapi.entityService.findMany('api::hotel.hotel', {
                        populate,
                        publicationState: 'preview',
                        locale: localeCodes, // Or 'all' if entityService supports it, but array is safer
                    });
                    strapi.log.info('Export: Used entityService API');
                }
            } catch (err) {
                strapi.log.error('Export: Error fetching documents:', err);
                // Fallback to db query
                hotels = await strapi.db.query('api::hotel.hotel').findMany({
                    populate: true,
                });
            }

            strapi.log.info(`Export: Found ${hotels ? hotels.length : 0} total documents (all locales)`);

            if (!hotels || hotels.length === 0) {
                strapi.log.warn('Export: No hotels found, returning empty CSV with headers');
                // Return CSV with headers only
                const fields = this.getAllFields(schema);
                const parser = new Parser({ fields });
                return parser.parse([]);
            }

            // Group by documentId to merge locales
            const hotelsByDocId = _.groupBy(hotels, 'documentId');

            const mergedHotels = [];

            Object.values(hotelsByDocId).forEach(versions => {
                // Find English version (default)
                const enVersion = versions.find(v => v.locale === 'en');

                // Find Spanish version (any variation like es, es-CR, es-ES)
                const esVersion = versions.find(v => v.locale && v.locale.startsWith('es'));

                if (enVersion) {
                    // Base is English
                    const merged = { ...enVersion };

                    // If we have Spanish version, add description_es
                    if (esVersion) {
                        strapi.log.info(`Export: Found Spanish version for doc ${versions[0].documentId}. Desc length: ${esVersion.Description ? esVersion.Description.length : 'N/A'}`);
                        if (esVersion.Description) {
                            merged.description_es = esVersion.Description;
                        } else {
                            merged.description_es = '';
                        }
                    } else {
                        strapi.log.warn(`Export: No Spanish version found for doc ${versions[0].documentId}`);
                        merged.description_es = '';
                    }

                    mergedHotels.push(merged);
                } else {
                    // Optional: handle cases with only Spanish content if needed
                    // For now, only export if English version exists, or fallback
                    if (versions.length > 0) {
                        const fallback = { ...versions[0] };
                        // Initialize description_es if it's the spanish one to keep content
                        if (fallback.locale && fallback.locale.startsWith('es')) {
                            fallback.description_es = fallback.description;
                        } else {
                            fallback.description_es = '';
                        }
                        mergedHotels.push(fallback);
                    }
                }
            });

            strapi.log.info(`Export: Merged into ${mergedHotels.length} unique hotels`);

            // Flatten each hotel entity
            strapi.log.info('Export: Starting flattening process...');
            const flattenedHotels = mergedHotels.map((hotel) => {
                const flat = this.flattenEntity(hotel, schema, '');
                // Manually add the merged description_es to the flat object
                // because flattenEntity relies on the schema, and description_es is not in schema
                flat['description_es'] = hotel.description_es;
                return flat;
            });

            // Generate CSV
            // Headers will be keys of the first object
            if (flattenedHotels.length > 0) {
                const fields = Object.keys(flattenedHotels[0]);
                strapi.log.info(`Export: CSV Fields count: ${fields.length}`);

                const parser = new Parser({ fields });
                const csv = parser.parse(flattenedHotels);
                strapi.log.info(`Export: CSV generated. Length: ${csv.length}`);
                return csv;
            } else {
                return '';
            }
        } catch (error) {
            strapi.log.error('Error exporting hotels:', error);
            throw error;
        }
    },

    /**
     * Recursively flatten an entity with its components
     */
    flattenEntity(entity, schema, prefix = '') {
        const flattened = {};

        if (!entity) {
            return flattened;
        }

        // Iterate through schema attributes
        Object.entries(schema.attributes).forEach(([key, attribute]) => {
            const fieldName = prefix ? `${prefix}.${key}` : key;
            const value = entity[key];

            // Skip if value is undefined or null
            if (value === undefined || value === null) {
                flattened[fieldName] = '';
                return;
            }

            switch (attribute.type) {
                case 'component':
                    if (attribute.repeatable) {
                        // Repeatable component: serialize as JSON array
                        flattened[fieldName] = JSON.stringify(value);
                    } else {
                        // Non-repeatable component: flatten recursively
                        const componentSchema = this.getComponentSchema(attribute.component);
                        if (componentSchema && value) {
                            const flattenedComponent = this.flattenEntity(value, componentSchema, fieldName);
                            Object.assign(flattened, flattenedComponent);
                        }
                    }
                    break;

                case 'media':
                    // Extract media URL(s)
                    if (attribute.multiple && Array.isArray(value)) {
                        flattened[fieldName] = value.map((media) => media.url).join(', ');
                    } else if (value && value.url) {
                        flattened[fieldName] = value.url;
                    } else {
                        flattened[fieldName] = '';
                    }
                    break;

                case 'relation':
                    // Extract relation ID(s) or name(s)
                    if (Array.isArray(value)) {
                        flattened[fieldName] = value.map((rel) => rel.id || rel.name || rel).join(', ');
                    } else if (typeof value === 'object' && value !== null) {
                        flattened[fieldName] = value.id || value.name || '';
                    } else {
                        flattened[fieldName] = value;
                    }
                    break;

                case 'customField':
                    // Serialize custom fields as JSON
                    flattened[fieldName] = typeof value === 'object' ? JSON.stringify(value) : value;
                    break;

                case 'blocks':
                case 'richtext':
                    // Serialize rich text/blocks as JSON
                    flattened[fieldName] = JSON.stringify(value);
                    break;

                case 'json':
                    // Serialize JSON fields
                    flattened[fieldName] = JSON.stringify(value);
                    break;

                case 'boolean':
                    flattened[fieldName] = value ? 'true' : 'false';
                    break;

                case 'date':
                case 'datetime':
                case 'time':
                    flattened[fieldName] = value.toString();
                    break;

                default:
                    // Scalar fields (string, integer, float, email, etc.)
                    flattened[fieldName] = value;
                    break;
            }
        });

        return flattened;
    },

    /**
     * Get component schema by UID
     */
    getComponentSchema(componentUid) {
        return strapi.components[componentUid];
    },

    /**
     * Build deep populate object for entity service
     */
    buildPopulateObject(schema) {
        const populate = {};

        Object.entries(schema.attributes).forEach(([key, attribute]) => {
            if (attribute.type === 'component') {
                if (attribute.repeatable) {
                    // For repeatable components, use populate: true
                    populate[key] = { populate: '*' };
                } else {
                    // For non-repeatable components, recursively build populate
                    const componentSchema = this.getComponentSchema(attribute.component);
                    if (componentSchema) {
                        populate[key] = this.buildPopulateForComponent(componentSchema);
                    }
                }
            } else if (attribute.type === 'media' || attribute.type === 'relation') {
                populate[key] = true;
            }
        });

        return populate;
    },

    /**
     * Build populate object for a component
     */
    buildPopulateForComponent(componentSchema) {
        const populate = {};

        Object.entries(componentSchema.attributes).forEach(([key, attribute]) => {
            if (attribute.type === 'component') {
                const nestedComponentSchema = this.getComponentSchema(attribute.component);
                if (nestedComponentSchema) {
                    populate[key] = this.buildPopulateForComponent(nestedComponentSchema);
                }
            } else if (attribute.type === 'media' || attribute.type === 'relation') {
                populate[key] = true;
            }
        });

        return Object.keys(populate).length > 0 ? { populate } : true;
    },

    /**
     * Get all field names from schema for CSV headers
     */
    getAllFields(schema) {
        const fields = [];

        Object.entries(schema.attributes).forEach(([key, attribute]) => {
            if (attribute.type === 'component' && !attribute.repeatable) {
                const componentSchema = this.getComponentSchema(attribute.component);
                if (componentSchema) {
                    const componentFields = this.getComponentFields(componentSchema, key);
                    fields.push(...componentFields);
                }
            } else {
                fields.push(key);
            }
        });

        return fields;
    },

    /**
     * Get all fields from a component recursively
     */
    getComponentFields(componentSchema, prefix) {
        const fields = [];

        Object.entries(componentSchema.attributes).forEach(([key, attribute]) => {
            const fieldName = `${prefix}.${key}`;

            if (attribute.type === 'component' && !attribute.repeatable) {
                const nestedComponentSchema = this.getComponentSchema(attribute.component);
                if (nestedComponentSchema) {
                    const nestedFields = this.getComponentFields(nestedComponentSchema, fieldName);
                    fields.push(...nestedFields);
                }
            } else {
                fields.push(fieldName);
            }
        });

        return fields;
    }
});

export default exportService;
