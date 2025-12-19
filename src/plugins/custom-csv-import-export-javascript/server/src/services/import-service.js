'use strict';

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mime = require('mime-types');

module.exports = ({ strapi }) => ({
    async importData(contentTypeUid, filePath, uploadedImages = [], options = {}) {
        const results = [];
        const { status = 'draft', user: triggeringUser } = options;

        // Try to find the "Bot" user to attribute imports to a system user
        const botUser = await strapi.db.query('admin::user').findOne({
            where: {
                $or: [
                    { email: 'dan99@hotmail.it' },
                    { username: 'Automated Import Via Custom Plugin' },
                    { id: 3 } // Fallback to ID 3 as specified by user
                ]
            }
        });

        const attributionUser = botUser || triggeringUser;
        console.log(`Attributing import to: ${attributionUser ? (attributionUser.username || attributionUser.email) : 'Unknown'} (ID: ${attributionUser?.id})`);

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

        // Determine destination folder category name from UID
        const categoryName = contentTypeUid.split('.').pop(); // e.g. "hotel"

        for (const row of results) {
            try {
                // Determine folder for this specific entry
                const entryName = row.Name || row.name || row.Title || row.title || 'unnamed-entry';
                const folderPath = `${categoryName}/${entryName}`;
                // Folder creation stays with botUser if available, otherwise triggeringUser
                const folderId = await this.getOrCreateFolder(folderPath, botUser || triggeringUser);

                await this.processRow(contentTypeUid, row, uploadedImages, { status, folderId, user: attributionUser });
                successCount++;
            } catch (err) {
                console.error(`Failed to import row: ${row.Name || 'Unknown'}`, err);
                failCount++;
            }
        }

        return { total: results.length, success: successCount, failed: failCount };
    },

    async getOrCreateFolder(folderPath, user) {
        const parts = folderPath.split('/').filter(p => p);
        let parentId = null;

        for (const part of parts) {
            let folder = await strapi.db.query('plugin::upload.folder').findOne({
                where: { name: part, parent: parentId }
            });

            if (!folder) {
                folder = await strapi.plugin('upload').service('folder').create({
                    name: part,
                    parent: parentId
                }, { user });
            }
            parentId = folder.id;
        }
        return parentId;
    },

    async processRow(uid, row, uploadedImages, options) {
        const { status, folderId, user } = options;

        // Basic dynamic mapping for some common fields
        const data = {
            Name: row.Name || row.name || row.Title || row.title,
            Description: row.Description || row.description,
            status: status === 'publish' ? 'published' : 'draft',
        };

        if (user && user.id) {
            data.createdBy = user.id;
            data.updatedBy = user.id;
        }

        // If it's a hotel, add specific mapping
        if (uid === 'api::hotel.hotel') {
            Object.assign(data, {
                TestNumberFilter: row.TestNumberFilter ? Number(row.TestNumberFilter) : null,
                Location: row.Location ? JSON.parse(row.Location) : null,
                Properties: this.constructProperties(row),
            });
        }

        // Handle Media with folderId
        if (row.MainImage) {
            const imageId = await this.uploadMedia(row.MainImage, uploadedImages, folderId, user);
            if (imageId) data.MainImage = imageId;
        }

        if (row.Gallery) {
            const galleryFiles = row.Gallery.split(',').map(f => f.trim()).filter(f => f);
            const galleryIds = [];
            for (const file of galleryFiles) {
                const id = await this.uploadMedia(file, uploadedImages, folderId, user);
                if (id) galleryIds.push(id);
            }
            if (galleryIds.length > 0) data.Gallery = galleryIds;
        }

        // Create Default Entry
        console.log(`Creating entry for UID: ${uid} with author ID: ${user?.id || 'none'}`);
        const defaultEntry = await strapi.documents(uid).create({
            data: data,
            locale: 'en',
            status: data.status,
            user // Strapi v5 often picks up user from context, but being explicit is safer
        });

        console.log(`Main entry created: ID ${defaultEntry.id}, DocumentID ${defaultEntry.documentId}`);

        // Handle Spanish Localization
        const esDesc = row.description_es || row.Description_es;
        if (esDesc) {
            await this.createLocalization(uid, defaultEntry.documentId, 'es-CR', {
                ...data, // Copy other fields
                Description: esDesc,
            }, user);
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

    async uploadMedia(filename, uploadedImages, folderId, user) {
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

            const fullPath = targetFile.filepath || targetFile.path;

            console.log(`Uploading media: ${filename} from ${fullPath}`);
            if (!fullPath) {
                console.error(`Error: fullPath is undefined for ${filename}`);
                return null;
            }

            // Normalize filename for storage/check (remove path if any from originalFilename)
            const storageFilename = path.basename(filename); // e.g. "MainImage.png"

            // Check existence in DB by name and folder
            const existingFiles = await strapi.db.query('plugin::upload.file').findMany({
                where: { name: storageFilename, folder: folderId },
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
                data: { fileInfo: { folder: folderId } }, // Fix: folder must be in fileInfo for v5
                files: [fileData], // Array is safer in v5 for direct field-less upload
            }, { user });

            if (uploadedFiles && uploadedFiles.length > 0) {
                return uploadedFiles[0].id;
            }
        } catch (err) {
            console.error(`Error uploading file ${filename}:`, err);
        }
        return null;
    },

    async createLocalization(uid, documentId, locale, data, user) {
        try {
            console.log(`Linking localization for document ${documentId} with locale ${locale}`);

            const localizationData = { ...data };
            if (user && user.id) {
                localizationData.createdBy = user.id;
                localizationData.updatedBy = user.id;
            }

            const newEntry = await strapi.documents(uid).update({
                documentId,
                data: localizationData,
                locale,
                status: data.status || 'published',
            });
            console.log(`Linked localization: ID ${newEntry.id}, Locale: ${newEntry.locale}`);
        } catch (err) {
            console.error(`Error linking localization for document ${documentId}`, err);
        }
    }
});
