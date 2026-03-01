import { MenuItem } from '@/Type/SideBarType';
import {
  BarChart,
  Users,
  FileText,
  UserCheck,
  Award,
  Lock,
} from 'react-feather';

export const MENUITEMS: MenuItem[] = [
  {
    title: '',
    Items: [
      {
        title: 'Dashboard',
        icon: <BarChart />,
        type: 'link',
        path: '/dashboard',
      },
    ],
  },
  {
    title: 'Customer Mgt.',
    Items: [
      {
        title: 'Customer',
        icon: <Users />,
        type: 'link',
        path: '/customer',
      },
      {
        title: 'Contracts',
        icon: <FileText />,
        type: 'link',
        path: '/contracts',
      },
      {
        title: 'Customer Role',
        icon: <UserCheck />,
        type: 'link',
        path: '/customer-role',
      },
    ],
  },
  {
    title: 'Employee Mgt.',
    Items: [
      {
        title: 'Roles',
        icon: <Award />,
        type: 'link',
        path: '/roles',
      },
      {
        title: 'Users',
        icon: <Users />,
        type: 'link',
        path: '/users',
      },
      {
        title: 'Permissions',
        icon: <Lock />,
        type: 'link',
        path: '/permissions',
      },
    ],
  },
];
