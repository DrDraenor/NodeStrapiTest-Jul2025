import { Parser } from 'json2csv';
import _ from 'lodash';


interface FlattenedData {
    [key: string]: any;
}

export default ({ strapi }) => ({
    /**
     * Export all hotels to CSV format with flattened components
     */
    async exportHotels(): Promise<string> {
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

            // Fetch hotels using Strapi v5 Document Service or fallbacks
            let hotels = [];
            try {
                // @ts-ignore
                if (strapi.documents) {
                    // @ts-ignore
                    hotels = await strapi.documents('api::hotel.hotel').findMany({
                        populate: populate,
                        status: 'draft',
                    });
                    strapi.log.info('Export: Used strapi.documents API');
                } else {
                    hotels = await strapi.entityService.findMany('api::hotel.hotel', {
                        populate,
                        publicationState: 'preview',
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

            console.log('=== EXPORT DEBUG ===');
            console.log('Found hotels:', hotels ? hotels.length : 0);

            if (hotels && hotels.length > 0) {
                console.log('Hotel keys:', Object.keys(hotels[0]));
            }

            strapi.log.info(`Export: Found ${hotels ? hotels.length : 0} hotels`);

            if (!hotels || hotels.length === 0) {
                strapi.log.warn('Export: No hotels found, returning empty CSV with headers');
                // Return CSV with headers only
                const fields = this.getAllFields(schema);
                const parser = new Parser({ fields });
                return parser.parse([]);
            }

            // Flatten each hotel entity
            strapi.log.info('Export: Starting flattening process...');
            const flattenedHotels = hotels.map((hotel: any) => {
                const flat = this.flattenEntity(hotel, schema, '');
                // strapi.log.info(`Export: Flattened keys for hotel ${hotel.id}: ${Object.keys(flat).join(', ')}`);
                return flat;
            });

            try {
                strapi.log.info('Export: Flattened first hotel keys:', Object.keys(flattenedHotels[0]).join(', '));
            } catch (e) {
                strapi.log.error('Export: Could not log keys:', e);
            }

            // Generate CSV
            const fields = Object.keys(flattenedHotels[0]);
            strapi.log.info(`Export: CSV Fields count: ${fields.length}`);

            const parser = new Parser({ fields });
            const csv = parser.parse(flattenedHotels);

            strapi.log.info(`Export: CSV generated. Length: ${csv.length}`);
            strapi.log.info(`Export: CSV Preview: ${csv.substring(0, 200)}`);

            return csv;
        } catch (error) {
            strapi.log.error('Error exporting hotels:', error);
            throw error;
        }
    },

    /**
     * Recursively flatten an entity with its components
     */
    flattenEntity(entity: any, schema: any, prefix: string = ''): FlattenedData {
        const flattened: FlattenedData = {};

        if (!entity) {
            return flattened;
        }

        // Iterate through schema attributes
        Object.entries(schema.attributes).forEach(([key, attribute]: [string, any]) => {
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
                        flattened[fieldName] = value.map((media: any) => media.url).join(', ');
                    } else if (value && value.url) {
                        flattened[fieldName] = value.url;
                    } else {
                        flattened[fieldName] = '';
                    }
                    break;

                case 'relation':
                    // Extract relation ID(s) or name(s)
                    if (Array.isArray(value)) {
                        flattened[fieldName] = value.map((rel: any) => rel.id || rel.name || rel).join(', ');
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
    getComponentSchema(componentUid: string): any {
        return strapi.components[componentUid];
    },

    /**
     * Build deep populate object for entity service
     */
    buildPopulateObject(schema: any): any {
        const populate: any = {};

        Object.entries(schema.attributes).forEach(([key, attribute]: [string, any]) => {
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
    buildPopulateForComponent(componentSchema: any): any {
        const populate: any = {};

        Object.entries(componentSchema.attributes).forEach(([key, attribute]: [string, any]) => {
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
    getAllFields(schema: any): string[] {
        const fields: string[] = [];

        Object.entries(schema.attributes).forEach(([key, attribute]: [string, any]) => {
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
    getComponentFields(componentSchema: any, prefix: string): string[] {
        const fields: string[] = [];

        Object.entries(componentSchema.attributes).forEach(([key, attribute]: [string, any]) => {
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
    },
});
