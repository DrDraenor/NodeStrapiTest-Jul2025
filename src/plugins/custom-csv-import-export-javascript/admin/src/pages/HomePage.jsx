import { Main, Box, Typography, Button, Flex, TextInput } from '@strapi/design-system';
import { Download, Upload } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useState, useRef } from 'react';
import { useNotification, useFetchClient } from '@strapi/strapi/admin';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, post } = useFetchClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [mediaPath, setMediaPath] = useState('');
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setIsLoading(true);

    try {
      const response = await get('/custom-csv-import-export-javascript/export/hotels');
      console.log('Export response:', response);

      const csvContent = response.data?.data;

      if (!csvContent) {
        throw new Error('No CSV content received');
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `hotels-${timestamp}.csv`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('export.success'),
          defaultMessage: 'Hotels exported successfully!',
        }),
      });
    } catch (error) {
      console.error('Export error:', error);
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('export.error'),
          defaultMessage: 'Failed to export hotels. Please try again.',
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsImporting(true);

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Append media files if any
    if (window.selectedMediaFiles) {
      Array.from(window.selectedMediaFiles).forEach(mediaFile => {
        formData.append('images', mediaFile);
      });
    }

    try {
      const response = await post('/custom-csv-import-export-javascript/import/hotels', formData, {
        headers: {
          // Let browser set Content-Type for FormData
        }
      });

      console.log('Import response:', response);
      const stats = response.data?.stats;

      toggleNotification({
        type: 'success',
        message: `Import completed. Total: ${stats?.total || 0}, Success: ${stats?.success || 0}, Failed: ${stats?.failed || 0}`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toggleNotification({
        type: 'danger',
        message: 'Failed to import hotels. Check console for details.',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Main>
      <Box padding={8}>
        <Flex direction="column" alignItems="flex-start" gap={6}>
          <Typography variant="alpha">
            {formatMessage({
              id: getTranslation('plugin.name'),
              defaultMessage: 'CSV Import/Export',
            })}
          </Typography>

          <Typography variant="omega" textColor="neutral600">
            {formatMessage({
              id: getTranslation('plugin.description'),
              defaultMessage: 'Export or Import your hotel data.',
            })}
          </Typography>

          <Box paddingTop={4}>
            <Flex gap={4}>
              <Button
                startIcon={<Download />}
                onClick={handleExport}
                loading={isLoading}
                disabled={isLoading || isImporting}
              >
                {formatMessage({
                  id: getTranslation('export.button'),
                  defaultMessage: 'Export Hotels',
                })}
              </Button>
            </Flex>
          </Box>

          <Box paddingTop={2} style={{ width: '100%', maxWidth: '600px', borderTop: '1px solid #eee' }}>
            <Typography variant="beta" as="h3" style={{ marginBottom: '16px', display: 'block' }}>Import Hotels</Typography>

            <Flex direction="column" alignItems="flex-start" gap={4}>
              <Box>
                <Typography variant="pi" style={{ display: 'block', marginBottom: '8px' }}>1. Select Media Folder (Images)</Typography>
                <input
                  type="file"
                  webkitdirectory="true"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      window.selectedMediaFiles = e.target.files;
                      toggleNotification({
                        type: 'info',
                        message: `Selected ${e.target.files.length} media files.`
                      });
                    }
                  }}
                />
                <Typography variant="pi" textColor="neutral600">
                  Select the folder containing images.
                </Typography>
              </Box>

              <Box>
                <Typography variant="pi" style={{ display: 'block', marginBottom: '8px' }}>2. Select CSV & Start Import</Typography>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <Button
                  startIcon={<Upload />}
                  onClick={handleImportClick}
                  loading={isImporting}
                  disabled={isLoading || isImporting}
                  variant="secondary"
                >
                  Select CSV to Import
                </Button>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export { HomePage };
