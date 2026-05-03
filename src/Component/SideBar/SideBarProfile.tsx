'use client';

import { Javascript } from '@/Constant';
import React from 'react';
import { useAppSelector } from '@/Redux/ReduxStore';
import { useContractStatistics } from '@/features/contracts/useContractStatistics';

const SideBarProfile = () => {
  const user = useAppSelector((state) => state.auth.user);
  const displayName = user?.username ?? user?.email ?? user?.id ?? 'User';
  const { stats } = useContractStatistics();
  return (
    <div className='sidebar-user text-center'>
      <a href={Javascript}>
        <h6 className='mt-3 f-14 f-w-600'>{displayName}</h6>
      </a>
      <p className='mb-0 font-roboto'>Internet Banking</p>
      <ul>
        <li>
          <span>{stats.pendingContracts ?? 0}</span>
          <p>New</p>
        </li>
        <li>
          <span>{stats.operationalContracts ?? 0}</span>
          <p>In progress</p>
        </li>
        <li>
          <span>{stats.terminatedContracts ?? 0}</span>
          <p>Resolved</p>
        </li>
      </ul>
    </div>
  );
};

export default SideBarProfile;
