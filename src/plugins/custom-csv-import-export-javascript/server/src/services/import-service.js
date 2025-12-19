'use strict';

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mime = require('mime-types');

module.exports = ({ strapi }) => ({
    async importHotels(filePath, uploadedImages = []) {
        const results = [];

        // Parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        let successCount = 0;
        let failCount = 0;

        for (const row of results) {
            try {
                await this.processHotelRow(row, uploadedImages);
                successCount++;
            } catch (err) {
                console.error(`Failed to import row: ${row.Name || 'Unknown'}`, err);
                failCount++;
            }
        }

        return { total: results.length, success: successCount, failed: failCount };
    },

    async processHotelRow(row, uploadedImages) {
        // 1. Prepare base data
        const hotelData = {
            Name: row.Name,
            TestNumberFilter: row.TestNumberFilter ? Number(row.TestNumberFilter) : null,
            Description: row.Description, // English/Default description
            // Handle Location (JSON)
            Location: row.Location ? JSON.parse(row.Location) : null,
            // Nested Properties
            Properties: this.constructProperties(row),
        };

        // 2. Handle Media (MainImage and Gallery)
        // We look for a file in uploadedImages whose 'originalFilename' ends with the CSV value

        if (row.MainImage) {
            const imageId = await this.uploadMedia(row.MainImage, uploadedImages);
            if (imageId) hotelData.MainImage = imageId;
        }

        if (row.Gallery) {
            const galleryFiles = row.Gallery.split(',').map(f => f.trim()).filter(f => f);
            const galleryIds = [];
            for (const file of galleryFiles) {
                const id = await this.uploadMedia(file, uploadedImages);
                if (id) galleryIds.push(id);
            }
            if (galleryIds.length > 0) hotelData.Gallery = galleryIds;
        }

        // 3. Create Default Entry (English)
        // Strapi v5: use strapi.documents
        const defaultEntry = await strapi.documents('api::hotel.hotel').create({
            data: hotelData,
            locale: 'en',
            status: 'published'
        });

        console.log(`Main entry created: ID ${defaultEntry.id}, DocumentID ${defaultEntry.documentId}`);

        // 4. Handle Spanish Localization (if exists)
        if (row.description_es) {
            // Strapi v5: use update with a new locale to add a localization
            await this.createLocalization(defaultEntry.documentId, 'es-CR', {
                Name: row.Name,
                Description: row.description_es,
                TestNumberFilter: hotelData.TestNumberFilter,
                Location: hotelData.Location,
                Properties: hotelData.Properties,
                MainImage: hotelData.MainImage,
                Gallery: hotelData.Gallery
            });
        }
    },

    constructProperties(row) {
        const parseBool = (val) => {
            if (typeof val === 'string') return val.toUpperCase() === 'TRUE';
            return !!val;
        };

        // Helper to format date YYYY-MM-DD
        const parseDate = (val) => {
            if (!val) return null;
            // Try DD/MM/YYYY, YYYY-MM-DD, or DD.MM.YYYY
            const parts = val.split(/[\/\-\.]/);
            if (parts.length === 3) {
                // Assume DD/MM/YYYY if year is last
                if (parts[2].length === 4) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
                // Assume YYYY-MM-DD if year is first
                if (parts[0].length === 4) {
                    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
            }
            return val; // Fallback to as-is
        };

        let openingTimes = [];
        if (row['Properties.OpeningAndClosingTimes']) {
            try {
                openingTimes = JSON.parse(row['Properties.OpeningAndClosingTimes']);
            } catch (e) { console.warn('Failed to parse OpeningTimes', e); }
        }

        return {
            IsFilterLegend: false,
            AllPaymentMethodsAccepted: parseBool(row['Properties.AllPaymentMethodsAccepted']),
            PropertyOptions: {
                ParkingOnTheRoad: parseBool(row['Properties.PropertyOptions.ParkingOnTheRoad']),
                PrivateParking: parseBool(row['Properties.PropertyOptions.PrivateParking']),
                WheelchairAccess: parseBool(row['Properties.PropertyOptions.WheelchairAccess']),
                AC: parseBool(row['Properties.PropertyOptions.AC']),
                WiFi: parseBool(row['Properties.PropertyOptions.WiFi']),
                AllInclusive: parseBool(row['Properties.PropertyOptions.AllInclusive']),
                BreakfastIncluded: parseBool(row['Properties.PropertyOptions.BreakfastIncluded']),
                AdultsOnly: parseBool(row['Properties.PropertyOptions.AdultsOnly']),
                FamilyEnvironment: parseBool(row['Properties.PropertyOptions.FamilyEnvironment']),
                PetsAllowed: parseBool(row['Properties.PropertyOptions.PetsAllowed']),
            },
            PaymentMethods: {
                CashUSD: parseBool(row['Properties.PaymentMethods.CashUSD']),
                CashCRC: parseBool(row['Properties.PaymentMethods.CashCRC']),
                CreditCard: parseBool(row['Properties.PaymentMethods.CreditCard']),
                Sinpe: parseBool(row['Properties.PaymentMethods.Sinpe']),
                ElectronicInvoicing: parseBool(row['Properties.PaymentMethods.ElectronicInvoicing']),
                NormalBill: parseBool(row['Properties.PaymentMethods.NormalBill']),
                CompleteInvoice: parseBool(row['Properties.PaymentMethods.CompleteInvoice']),
                SimplifiedInvoice: parseBool(row['Properties.PaymentMethods.SimplifiedInvoice']),
            },
            FoundingDate: parseDate(row['Properties.FoundingDate']),
            Open247: parseBool(row['Properties.Open247']),
            OpeningAndClosingTimes: openingTimes,
            Contacts: {
                Email: row['Properties.Contacts.Email'],
                Website: row['Properties.Contacts.Website'],
                Facebook: row['Properties.Contacts.Facebook'],
                PhoneNumber1: row['Properties.Contacts.PhoneNumber1'],
                PhoneNumber2: row['Properties.Contacts.PhoneNumber2'],
            }
        };
    },

    async uploadMedia(filename, uploadedImages) {
        try {
            // Find the file in uploadedImages
            // Use path.basename to compare just filenames if needed, or simple string inclusion
            const targetFile = uploadedImages.find(img => {
                // If uploaded is 'media/1.png' and CSV is '1.png'
                return img.originalFilename.endsWith(filename) ||
                    img.originalFilename === filename;
            });

            if (!targetFile) {
                console.warn(`File not found in uploaded batch: ${filename}`);
                return null;
            }

            const uploadService = strapi.plugin('upload').service('upload');
            const fullPath = targetFile.filepath || targetFile.path;

            console.log(`Uploading media: ${filename} from ${fullPath}`);
            if (!fullPath) {
                console.error(`Error: fullPath is undefined for ${filename}`);
                return null;
            }

            // Normalize filename for storage/check (remove path if any from originalFilename)
            const storageFilename = path.basename(filename); // e.g. "MainImage.png"

            // Check existence in DB by name
            const existingFiles = await strapi.entityService.findMany('plugin::upload.file', {
                filters: { name: storageFilename },
            });

            if (existingFiles && existingFiles.length > 0) {
                return existingFiles[0].id;
            }

            // Stat the file from temp location
            const stats = fs.statSync(fullPath);

            // Strapi v5 programmatic upload:
            // Providing 'filepath' is crucial for its internal getStream() logic.
            // Using 'originalFilename' and 'mimetype' ensures correct metadata in media library.
            const fileData = {
                originalFilename: storageFilename,
                mimetype: targetFile.mimetype || mime.lookup(fullPath) || 'application/octet-stream',
                filepath: fullPath,
                size: stats.size,
            };

            console.log(`Calling upload service for ${filename}`);
            const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
                data: {},
                files: [fileData], // Array is safer in v5 for direct field-less upload
            });

            if (uploadedFiles && uploadedFiles.length > 0) {
                return uploadedFiles[0].id;
            }
        } catch (err) {
            console.error(`Error uploading file ${filename}:`, err);
        }
        return null;
    },

    async createLocalization(documentId, locale, data) {
        try {
            console.log(`Linking localization for document ${documentId} with locale ${locale}`);
            // In Strapi v5, update() with a new locale adds it to the document.
            const newEntry = await strapi.documents('api::hotel.hotel').update({
                documentId,
                data,
                locale,
                status: 'published'
            });
            console.log(`Linked localization: ID ${newEntry.id}, Locale: ${newEntry.locale}`);
        } catch (err) {
            console.error(`Error linking localization for document ${documentId}`, err);
        }
    }
});
