import { Activity, CheckCircle, FileText, Shield } from 'react-feather';

export const notificationData = [
  {
    status: 'Transfer in progress',
    time: '10 minutes ago',
    name: 'primary',
    icon: <Activity />,
  },
  {
    status: 'Transfer completed',
    time: '1 hour ago',
    name: 'secondary',
    icon: <CheckCircle />,
  },
  {
    status: 'Account statement ready',
    time: '3 hours ago',
    name: 'success',
    icon: <FileText />,
  },
  {
    status: 'Security alert: new login',
    time: '6 hours ago',
    name: 'danger',
    icon: <Shield />,
  },
];

