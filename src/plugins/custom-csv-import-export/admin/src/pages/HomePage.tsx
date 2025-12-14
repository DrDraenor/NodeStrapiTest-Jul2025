import { Main, Box, Typography, Button, Flex } from '@strapi/design-system';
import { Download } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useState } from 'react';
import { useNotification, useFetchClient } from '@strapi/strapi/admin';

import { getTranslation } from '../utils/getTranslation';
import { PLUGIN_ID } from '../pluginId';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get } = useFetchClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);

    try {
      // Make API request with default JSON response type
      const response = await get('/api/custom-csv-import-export/export/hotels');

      console.log('Export response:', response);

      const csvContent = response.data?.data;

      if (!csvContent) {
        throw new Error('No CSV content received');
      }

      console.log('CSV Length:', csvContent.length);

      // Create a blob from the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `hotels-${timestamp}.csv`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success notification
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('export.success'),
          defaultMessage: 'Hotels exported successfully!',
        }),
      });
    } catch (error) {
      console.error('Export error:', error);

      // Show error notification
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
              defaultMessage: 'Export your hotel data to CSV format with support for nested components.',
            })}
          </Typography>

          <Box paddingTop={4}>
            <Button
              startIcon={<Download />}
              onClick={handleExport}
              loading={isLoading}
              disabled={isLoading}
            >
              {formatMessage({
                id: getTranslation('export.button'),
                defaultMessage: 'Export Hotels',
              })}
            </Button>
          </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export { HomePage };
