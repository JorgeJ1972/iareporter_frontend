import { combineReducers } from '@reduxjs/toolkit'
import projectReducer from './slices/projectSlice'

const rootReducer = combineReducers({
  project: projectReducer
})

export default rootReducer