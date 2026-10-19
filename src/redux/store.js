import { configureStore } from '@reduxjs/toolkit';
import sliceReducer from './slice.jsx';

export const store = configureStore( { reducer: sliceReducer } );
