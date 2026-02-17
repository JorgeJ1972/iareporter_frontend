import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ProjectResponse } from '../../types/project'

interface ProjectState {
  project: ProjectResponse | null
}

const initialState: ProjectState = {
  project: null
}

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProject: (state, action: PayloadAction<ProjectResponse>) => {
      state.project = action.payload
    },
    clearProject: (state) => {
      state.project = null
    }
  }
})

export const { setProject, clearProject } = projectSlice.actions
export default projectSlice.reducer
