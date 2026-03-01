'use client';

import { ToastContainer } from 'react-toastify';

const TOAST_AUTO_CLOSE_MS = 4000;

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={TOAST_AUTO_CLOSE_MS}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );
}

export { TOAST_AUTO_CLOSE_MS };
