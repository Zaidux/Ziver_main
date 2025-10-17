import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  Send, 
  People, 
  Announcement, 
  Message,
  History 
} from '@mui/icons-material';
import adminService from '../services/adminService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`telegram-tabpanel-${index}`}
      aria-labelledby={`telegram-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TelegramAnnouncements = () => {
  const [tabValue, setTabValue] = useState(0);
  const [announcementData, setAnnouncementData] = useState({
    message: '',
    announcementType: 'general',
    targetUsers: 'all'
  });
  const [userMessageData, setUserMessageData] = useState({
    telegramId: '',
    message: ''
  });
  const [stats, setStats] = useState(null);
  const [announcementHistory, setAnnouncementHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    loadStats();
    loadAnnouncementHistory();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminService.getTelegramStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAnnouncementHistory = async () => {
    try {
      const response = await adminService.getAnnouncementHistory();
      setAnnouncementHistory(response.announcements);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementData.message.trim()) {
      setAlert({ type: 'error', message: 'Please enter a message' });
      return;
    }

    setLoading(true);
    try {
      const response = await adminService.sendAnnouncement(announcementData);
      setAlert({ type: 'success', message: response.message });
      setAnnouncementData({ ...announcementData, message: '' });
      loadStats();
      loadAnnouncementHistory();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to send announcement' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendUserMessage = async () => {
    if (!userMessageData.telegramId || !userMessageData.message.trim()) {
      setAlert({ type: 'error', message: 'Please enter Telegram ID and message' });
      return;
    }

    setLoading(true);
    try {
      const response = await adminService.sendUserMessage(userMessageData);
      setAlert({ type: 'success', message: response.message });
      setUserMessageData({ telegramId: '', message: '' });
      loadAnnouncementHistory();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to send message' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const announcementTypes = [
    { value: 'general', label: 'General', color: 'primary' },
    { value: 'security', label: 'Security', color: 'error' },
    { value: 'update', label: 'Update', color: 'info' },
    { value: 'promotion', label: 'Promotion', color: 'success' },
    { value: 'maintenance', label: 'Maintenance', color: 'warning' }
  ];

  const targetOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active Users (Last 7 days)' },
    { value: 'mining_enabled', label: 'Users with Mining Alerts' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <Announcement sx={{ mr: 1, verticalAlign: 'bottom' }} />
        Telegram Announcements
      </Typography>

      {alert.message && (
        <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert({ type: '', message: '' })}>
          {alert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Telegram Users
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.total_users}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  System Updates Enabled
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.system_updates_enabled}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users (7 days)
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.active_users}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Recent Announcements
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.recent_announcements}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Announcement />} label="Send Announcement" />
          <Tab icon={<Message />} label="Send to User" />
          <Tab icon={<History />} label="History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Announcement Type</InputLabel>
                <Select
                  value={announcementData.announcementType}
                  label="Announcement Type"
                  onChange={(e) => setAnnouncementData({
                    ...announcementData,
                    announcementType: e.target.value
                  })}
                >
                  {announcementTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Chip 
                        label={type.label} 
                        size="small" 
                        color={type.color}
                        variant="outlined"
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Target Users</InputLabel>
                <Select
                  value={announcementData.targetUsers}
                  label="Target Users"
                  onChange={(e) => setAnnouncementData({
                    ...announcementData,
                    targetUsers: e.target.value
                  })}
                >
                  {targetOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Announcement Message"
                value={announcementData.message}
                onChange={(e) => setAnnouncementData({
                  ...announcementData,
                  message: e.target.value
                })}
                placeholder="Enter your announcement message here..."
                helperText="Markdown formatting is supported"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleSendAnnouncement}
                disabled={loading || !announcementData.message.trim()}
                size="large"
              >
                {loading ? 'Sending...' : 'Send Announcement'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telegram User ID"
                value={userMessageData.telegramId}
                onChange={(e) => setUserMessageData({
                  ...userMessageData,
                  telegramId: e.target.value
                })}
                placeholder="Enter Telegram ID"
                helperText="Find Telegram ID in user management"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={userMessageData.message}
                onChange={(e) => setUserMessageData({
                  ...userMessageData,
                  message: e.target.value
                })}
                placeholder="Enter your message here..."
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Message />}
                onClick={handleSendUserMessage}
                disabled={loading || !userMessageData.telegramId || !userMessageData.message.trim()}
                size="large"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Admin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {announcementHistory.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      {new Date(announcement.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={announcement.announcement_type} 
                        size="small"
                        color={
                          announcementTypes.find(t => t.value === announcement.announcement_type)?.color || 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{announcement.target_users}</TableCell>
                    <TableCell>{announcement.sent_count}</TableCell>
                    <TableCell>
                      {announcement.failed_count > 0 ? (
                        <Chip label={announcement.failed_count} size="small" color="error" />
                      ) : (
                        announcement.failed_count
                      )}
                    </TableCell>
                    <TableCell>{announcement.admin_username}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default TelegramAnnouncements;