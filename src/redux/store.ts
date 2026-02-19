import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit';
// Import your slices here. Example:
// import projectReducer from './slices/projectSlice';

const rootReducer = combineReducers({
  // Add your reducers here
  // project: projectReducer,
});

export default rootReducer;

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['project'] // Reducers que quieres persistir
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignora las acciones de redux-persist que contienen funciones (no serializables)
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
