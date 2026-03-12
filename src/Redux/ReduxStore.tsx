import { configureStore } from '@reduxjs/toolkit';
import HeaderSlice from './Slices/HeaderSlice';
import { TypedUseSelectorHook, useDispatch } from 'react-redux';
import EcommerceSlice from './Slices/E-comerceSlice';
import themeSlice from './Slices/themeCostomizer';
import authReducer from './Slices/authSlice';
import { useSelector } from 'react-redux';
const Store = configureStore({
  reducer: {
    headerSlice: HeaderSlice,
    EcommerceSlice,
    themeSlice,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default Store;

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
