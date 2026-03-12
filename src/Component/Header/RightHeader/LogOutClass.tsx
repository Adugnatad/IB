import { LogOutConst } from '@/Constant';
import { LogOut } from 'react-feather';
import { Button } from 'reactstrap';
import { useAppDispatch } from '@/Redux/ReduxStore';
import { logout } from '@/Redux/Slices/authSlice';
import { tokenManager } from '@/lib/auth/token-manager';
import { stopSessionScheduler } from '@/lib/auth/session-scheduler';
import { useRouter } from 'next/navigation';

const LogOutClass = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const logOutUser = () => {
    dispatch(logout());
    tokenManager.clearSession();
    stopSessionScheduler();
    router.replace('/');
  };
  return (
    <li className='onhover-dropdown p-0'>
      <Button onClick={logOutUser} color='primary-light'>
        <a>
          <LogOut />
          {LogOutConst}
        </a>
      </Button>
    </li>
  );
};

export default LogOutClass;
