import { Javascript } from '@/Constant';
import React from 'react';
import { useAppSelector } from '@/Redux/ReduxStore';

const SideBarProfile = () => {
  const user = useAppSelector((state) => state.auth.user);
  const displayName = user?.username ?? user?.email ?? user?.id ?? 'User';
  return (
    <div className='sidebar-user text-center'>
      <a href={Javascript}>
        <h6 className='mt-3 f-14 f-w-600'>{displayName}</h6>
      </a>
      <p className='mb-0 font-roboto'>Internet Banking</p>
      <ul>
        <li>
          <span>3</span>
          <p>New</p>
        </li>
        <li>
          <span>10</span>
          <p>In progress</p>
        </li>
        <li>
          <span>
            <span className='counter'>1</span>k
          </span>
          <p>Resolved</p>
        </li>
      </ul>
    </div>
  );
};

export default SideBarProfile;
