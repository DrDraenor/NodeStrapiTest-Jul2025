import { Parser } from 'json2csv';
import _ from 'lodash';

const exportService = ({ strapi }) => ({
    /**
     * Export all documents of a content type to CSV
     */
    async exportData(contentTypeUid) {
        try {
            const schema = strapi.getModel(contentTypeUid);

            if (!schema) {
                throw new Error(`Content type ${contentTypeUid} not found`);
            }

            strapi.log.info(`Export: ${contentTypeUid} schema found, building populate object`);
            const populate = this.buildPopulateObject(schema);

            const usedLocales = await strapi.plugin('i18n').service('locales').find();
            const localeCodes = usedLocales.map((l) => l.code);
            strapi.log.info(`Export: Querying for locales: ${localeCodes.join(', ')}`);

            let documents = [];
            try {
                if (strapi.documents) {
                    documents = await strapi.documents(contentTypeUid).findMany({
                        populate: populate,
                        status: 'draft',
                        locale: localeCodes,
                    });
                } else {
                    documents = await strapi.entityService.findMany(contentTypeUid, {
                        populate,
                        publicationState: 'preview',
                        locale: localeCodes,
                    });
                }
            } catch (err) {
                strapi.log.error('Export: Error fetching documents, falling back to db query', err);
                documents = await strapi.db.query(contentTypeUid).findMany({
                    populate: true,
                });
            }

            strapi.log.info(`Export: Found ${documents ? documents.length : 0} total documents`);

            if (!documents || documents.length === 0) {
                strapi.log.warn('Export: No documents found, returning empty CSV with headers');
                const fields = this.getAllFields(schema);
                const parser = new Parser({ fields });
                return parser.parse([]);
            }

            // Group by documentId to merge locales
            const docsByDocId = _.groupBy(documents, 'documentId');
            const mergedDocs = [];

            Object.values(docsByDocId).forEach(versions => {
                const enVersion = versions.find(v => v.locale === 'en');
                const esVersion = versions.find(v => v.locale && v.locale.startsWith('es'));

                if (enVersion) {
                    const merged = { ...enVersion };
                    if (esVersion) {
                        if (esVersion.Description) {
                            merged.description_es = esVersion.Description;
                        } else {
                            merged.description_es = '';
                        }
                    } else {
                        merged.description_es = '';
                    }
                    mergedDocs.push(merged);
                } else if (versions.length > 0) {
                    const fallback = { ...versions[0] };
                    if (fallback.locale && fallback.locale.startsWith('es')) {
                        fallback.description_es = fallback.description;
                    } else {
                        fallback.description_es = '';
                    }
                    mergedDocs.push(fallback);
                }
            });

            strapi.log.info(`Export: Merged into ${mergedDocs.length} unique documents`);

            // Flatten
            const flattenedDocs = mergedDocs.map((doc) => {
                const flat = this.flattenEntity(doc, schema, '');
                if (doc.description_es !== undefined) {
                    flat['description_es'] = doc.description_es;
                }
                return flat;
            });

            if (flattenedDocs.length > 0) {
                const fields = Object.keys(flattenedDocs[0]);
                const parser = new Parser({ fields });
                return parser.parse(flattenedDocs);
            } else {
                return '';
            }
        } catch (error) {
            strapi.log.error('Error exporting data:', error);
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
