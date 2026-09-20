import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { setAccessToken, logOut } from './authSlice.js';

// Mutex lock to prevent multiple concurrent refresh token requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth?.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        // Request refreshed token using httpOnly cookie
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const newAccessToken = (refreshResult.data as any).data?.accessToken;
          api.dispatch(setAccessToken(newAccessToken));
          onRefreshed(newAccessToken);

          // Retry the original query with the new token
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logOut());
        }
      } catch (err) {
        api.dispatch(logOut());
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for ongoing refresh to complete
      const retryPromise = new Promise<void>((resolve) => {
        addRefreshSubscriber(() => {
          resolve();
        });
      });
      await retryPromise;
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};
