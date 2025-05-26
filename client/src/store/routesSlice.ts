import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  fetchRoutes as apiFetchRoutes,
  fetchRouteDetail as apiFetchRouteDetail,
  saveRoute as apiSaveRoute,
  deleteRoute as apiDeleteRoute,
  updateRoute as apiUpdateRoute
} from '@/lib/api';
import type { RouteMeta, RouteDetail } from '@/types';

interface RoutesState {
  routes: RouteMeta[];
  selectedRouteId: number | 'new' | null;
  mode: 'edit' | 'view';
  routeDetail: RouteDetail | null;
  drawnGeometry: any | null;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: RoutesState = {
  routes: [],
  selectedRouteId: 'new',
  mode: 'edit',
  routeDetail: null,
  drawnGeometry: null,
  status: 'idle'
};

export const fetchRoutes = createAsyncThunk('routes/fetchRoutes', async () => {
  return await apiFetchRoutes();
});

export const fetchRouteDetail = createAsyncThunk(
  'routes/fetchRouteDetail',
  async (id: number) => {
    return await apiFetchRouteDetail(id);
  }
);

export const saveRoute = createAsyncThunk(
  'routes/saveRoute',
  async (
    { name, geometry, distance }: { name: string; geometry: any; distance: number },
    { dispatch }
  ) => {
    await apiSaveRoute(name, geometry, distance);
    dispatch(setSelectedRouteId('new'));
    dispatch(setDrawnGeometry(null));
    return await apiFetchRoutes();
  }
);

export const deleteRoute = createAsyncThunk(
  'routes/deleteRoute',
  async (id: number) => {
    await apiDeleteRoute(id);
    return await apiFetchRoutes();
  }
);

export const updateRoute = createAsyncThunk(
  'routes/updateRoute',
  async ({ id, name, geometry, distance }: { id: number; name: string; geometry: any; distance: number }) => {
    await apiUpdateRoute(id, name, geometry, distance);
    return await apiFetchRoutes();
  }
);

const routesSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    setSelectedRouteId(state, action: PayloadAction<number | 'new' | null>) {
      state.selectedRouteId = action.payload;
      state.mode = action.payload === 'new' ? 'edit' : 'view';
      state.routeDetail = null;
    },
    setDrawnGeometry(state, action: PayloadAction<any | null>) {
      state.drawnGeometry = action.payload;
    },
    setMode(state, action: PayloadAction<'edit' | 'view'>) {
      state.mode = action.payload;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRoutes.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.status = 'idle';
        state.routes = action.payload;
      })
      .addCase(fetchRoutes.rejected, state => {
        state.status = 'failed';
      })
      .addCase(fetchRouteDetail.fulfilled, (state, action) => {
        state.routeDetail = action.payload;
      })
      .addCase(saveRoute.fulfilled, (state, action) => {
        state.routes = action.payload;
      })
      .addCase(deleteRoute.fulfilled, (state, action) => {
        state.routes = action.payload;
      })
      .addCase(updateRoute.fulfilled, (state, action) => {
        state.routes = action.payload;
      });
  }
});

export const { setSelectedRouteId, setDrawnGeometry, setMode } = routesSlice.actions;

export default routesSlice.reducer;
