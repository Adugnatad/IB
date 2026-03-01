import { Javascript } from '@/Constant';
import { useSession } from 'next-auth/react';
import React from 'react';

const SideBarProfile = () => {
  const { data: session } = useSession();
  return (
    <div className='sidebar-user text-center'>
      <a href={Javascript}>
        <h6 className='mt-3 f-14 f-w-600'>{session?.user?.name || 'C360 Administrator'}</h6>
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
