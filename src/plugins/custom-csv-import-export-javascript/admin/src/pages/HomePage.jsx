import { Main, Box, Typography, Button, Flex, TextInput, SingleSelect, SingleSelectOption, Divider, Tbody, Tr, Td, Table, Th, Thead } from '@strapi/design-system';
import { Download, Upload, Information, CheckCircle, WarningCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useState, useRef, useEffect } from 'react';
import { useNotification, useFetchClient } from '@strapi/strapi/admin';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, post } = useFetchClient();

  const [contentTypes, setContentTypes] = useState([]);
  const [selectedContentType, setSelectedContentType] = useState('');
  const [publishStatus, setPublishStatus] = useState('draft');

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [step, setStep] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvSummary, setCsvSummary] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchContentTypes();
  }, []);

  const fetchContentTypes = async () => {
    try {
      const { data } = await get('/custom-csv-import-export-javascript/content-types');
      setContentTypes(data.data || []);
      if (data.data?.length > 0) {
        setSelectedContentType(data.data[0].uid);
      }
    } catch (error) {
      console.error('Failed to fetch content types', error);
    }
  };

  const handleExport = async () => {
    if (!selectedContentType) return;
    setIsExporting(true);

    try {
      const response = await get(`/custom-csv-import-export-javascript/export/${selectedContentType}`);
      const csvContent = response.data?.data;

      if (!csvContent) throw new Error('No CSV content received');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ctName = contentTypes.find(c => c.uid === selectedContentType)?.displayName || 'data';
      link.download = `${ctName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toggleNotification({ type: 'success', message: 'Export successful' });
    } catch (error) {
      toggleNotification({ type: 'danger', message: 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCsvAnalysis = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await post('/custom-csv-import-export-javascript/import-summary', formData);
      setCsvSummary(data.data);
    } catch (error) {
      toggleNotification({ type: 'danger', message: 'Failed to analyze CSV' });
    }
  };

  const handleRunImport = async () => {
    if (!csvFile || !selectedContentType) return;
    setIsImporting(true);

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('contentTypeUid', selectedContentType);
    formData.append('status', publishStatus);

    selectedMedia.forEach(f => {
      formData.append('images', f);
    });

    try {
      const response = await post('/custom-csv-import-export-javascript/import', formData);
      const stats = response.data?.stats;

      toggleNotification({
        type: 'success',
        message: `Import Done. Success: ${stats?.success || 0}, Failed: ${stats?.failed || 0}`,
      });
      setStep(1);
      setCsvFile(null);
      setCsvSummary(null);
      setSelectedMedia([]);
    } catch (error) {
      toggleNotification({ type: 'danger', message: 'Import failed' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Main>
      <Box padding={8} background="neutral100">
        <Typography variant="alpha" style={{ marginBottom: '24px', display: 'block' }}>
          Data Port (CSV Import/Export)
        </Typography>

        <Flex direction="column" alignItems="stretch" gap={8}>
          {/* EXPORT SECTION */}
          <Box padding={6} background="neutral0" hasRadius shadow="filterShadow">
            <Typography variant="beta" as="h2" style={{ marginBottom: '16px', display: 'block' }}>
              Export Data
            </Typography>
            <Flex gap={4} alignItems="flex-end">
              <Box style={{ width: '300px' }}>
                <SingleSelect
                  label="Select Content Type"
                  value={selectedContentType}
                  onChange={setSelectedContentType}
                >
                  {contentTypes.map(ct => (
                    <SingleSelectOption key={ct.uid} value={ct.uid}>{ct.displayName}</SingleSelectOption>
                  ))}
                </SingleSelect>
              </Box>
              <Button startIcon={<Download />} onClick={handleExport} loading={isExporting} disabled={isExporting || isImporting}>
                Export to CSV
              </Button>
            </Flex>
          </Box>

          <Divider />

          {/* IMPORT SECTION */}
          <Box padding={6} background="neutral0" hasRadius shadow="filterShadow">
            <Typography variant="beta" as="h2" style={{ marginBottom: '16px', display: 'block' }}>
              Import Data (Step {step} of 4)
            </Typography>

            {step === 1 && (
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Box style={{ width: '300px' }}>
                  <SingleSelect label="1. Target Content Type" value={selectedContentType} onChange={setSelectedContentType}>
                    {contentTypes.map(ct => (
                      <SingleSelectOption key={ct.uid} value={ct.uid}>{ct.displayName}</SingleSelectOption>
                    ))}
                  </SingleSelect>
                </Box>
                <Box style={{ width: '300px' }}>
                  <SingleSelect label="2. Import as..." value={publishStatus} onChange={setPublishStatus}>
                    <SingleSelectOption value="draft">Draft (Default)</SingleSelectOption>
                    <SingleSelectOption value="publish">Published</SingleSelectOption>
                  </SingleSelect>
                </Box>
                <Button onClick={() => setStep(2)}>Next: Select Media</Button>
              </Flex>
            )}

            {step === 2 && (
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Typography variant="pi" style={{ display: 'block' }}>Upload images/media first. They will be organized into folders automatically.</Typography>
                <input
                  type="file"
                  webkitdirectory="true"
                  multiple
                  onChange={(e) => setSelectedMedia(Array.from(e.target.files || []))}
                />
                {selectedMedia.length > 0 && (
                  <Box padding={4} background="neutral100" hasRadius>
                    <Typography variant="sigma">Found {selectedMedia.length} files. Structure preview:</Typography>
                    <ul style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '8px', fontSize: '12px' }}>
                      {selectedMedia.slice(0, 10).map((f, i) => <li key={i}>{f.webkitRelativePath || f.name}</li>)}
                      {selectedMedia.length > 10 && <li>... and {selectedMedia.length - 10} more</li>}
                    </ul>
                  </Box>
                )}
                <Flex gap={2}>
                  <Button variant="tertiary" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Next: Select CSV</Button>
                </Flex>
              </Flex>
            )}

            {step === 3 && (
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Typography variant="pi">Select the .csv file associated with your entries.</Typography>
                <input type="file" accept=".csv" onChange={handleCsvAnalysis} />

                {csvSummary && (
                  <Box padding={4} background="success100" hasRadius borderWidth={1} borderColor="success200">
                    <Flex gap={2} style={{ marginBottom: '8px' }}>
                      <CheckCircle width={16} fill="#328048" />
                      <Typography variant="omega" fontWeight="bold">CSV Analysis Ready</Typography>
                    </Flex>
                    <Typography variant="pi" style={{ display: 'block' }}>Found <b>{csvSummary.totalEntries}</b> entries to import.</Typography>
                    <Typography variant="pi" style={{ display: 'block', marginTop: '4px' }}>Previews: {csvSummary.preview.join(', ')} ...</Typography>
                  </Box>
                )}

                <Flex gap={2}>
                  <Button variant="tertiary" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={() => setStep(4)} disabled={!csvFile}>Next: Final Review</Button>
                </Flex>
              </Flex>
            )}

            {step === 4 && (
              <Flex direction="column" alignItems="stretch" gap={6}>
                <Box padding={4} background="neutral100" hasRadius>
                  <Typography variant="beta" style={{ marginBottom: '12px', display: 'block' }}>Final Confirmation</Typography>
                  <Table colCount={2} rowCount={4}>
                    <Tbody>
                      <Tr><Td><Typography variant="pi" fontWeight="bold">Target:</Typography></Td><Td><Typography variant="pi">{selectedContentType}</Typography></Td></Tr>
                      <Tr><Td><Typography variant="pi" fontWeight="bold">Status:</Typography></Td><Td><Typography variant="pi">{publishStatus}</Typography></Td></Tr>
                      <Tr><Td><Typography variant="pi" fontWeight="bold">CSV Entries:</Typography></Td><Td><Typography variant="pi text-success">{csvSummary?.totalEntries || 0}</Typography></Td></Tr>
                      <Tr><Td><Typography variant="pi" fontWeight="bold">Media Files:</Typography></Td><Td><Typography variant="pi">{selectedMedia.length}</Typography></Td></Tr>
                    </Tbody>
                  </Table>
                </Box>

                <Flex gap={2}>
                  <Button variant="tertiary" onClick={() => setStep(3)} disabled={isImporting}>Back</Button>
                  <Button variant="success" startIcon={<Upload />} onClick={handleRunImport} loading={isImporting}>
                    Confirm and Start Import
                  </Button>
                </Flex>
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export { HomePage };
