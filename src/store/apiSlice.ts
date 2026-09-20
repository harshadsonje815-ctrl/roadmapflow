import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth.js';
import {
  FeatureRequest,
  RoadmapColumn,
  CommentNode,
  User,
  PaginationMeta,
} from '../types/index.js';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Request', 'Roadmap', 'Comment', 'User'],
  endpoints: (builder) => ({
    // Authentication
    login: builder.mutation<
      { user: User; accessToken: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<
      { user: User; accessToken: string },
      { name: string; email: string; password: string; avatar?: string }
    >({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (res: any) => res.data?.user,
      providesTags: ['User'],
    }),

    // Feature Requests
    getRequests: builder.query<
      { docs: FeatureRequest[]; meta: PaginationMeta },
      {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        status?: string;
        sort?: string;
      }
    >({
      query: (params) => ({
        url: '/requests',
        params,
      }),
      transformResponse: (res: any) => ({
        docs: res.data,
        meta: res.meta,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.docs.map(({ _id }) => ({ type: 'Request' as const, id: _id })),
              { type: 'Request', id: 'LIST' },
            ]
          : [{ type: 'Request', id: 'LIST' }],
    }),

    getRequest: builder.query<FeatureRequest, string>({
      query: (slugOrId) => `/requests/${slugOrId}`,
      transformResponse: (res: any) => res.data,
      providesTags: (_result, _err, id) => [{ type: 'Request', id }],
    }),

    createRequest: builder.mutation<
      FeatureRequest,
      { title: string; description: string; category: string }
    >({
      query: (body) => ({
        url: '/requests',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: [{ type: 'Request', id: 'LIST' }, 'Roadmap'],
    }),

    updateRequest: builder.mutation<
      FeatureRequest,
      { id: string; title?: string; description?: string; category?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/requests/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Request', id }, 'Roadmap'],
    }),

    deleteRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Request', id: 'LIST' }, 'Roadmap'],
    }),

    // Atomic Voting with Optimistic UI Update
    toggleVote: builder.mutation<
      { hasVoted: boolean; voteCount: number },
      { requestId: string }
    >({
      query: ({ requestId }) => ({
        url: `/requests/${requestId}/vote`,
        method: 'POST',
      }),
      transformResponse: (res: any) => res.data,
      async onQueryStarted({ requestId }, { dispatch, queryFulfilled }) {
        // Optimistically patch getRequests list
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getRequests', {} as any, (draft) => {
            const item = draft.docs?.find((r) => r._id === requestId);
            if (item) {
              const prevVoted = !!item.hasVoted;
              item.hasVoted = !prevVoted;
              item.voteCount += prevVoted ? -1 : 1;
            }
          })
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(
            apiSlice.util.updateQueryData('getRequest', requestId, (draft) => {
              if (draft) {
                draft.hasVoted = data.hasVoted;
                draft.voteCount = data.voteCount;
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_res, _err, { requestId }) => [
        { type: 'Request', id: requestId },
        'Roadmap',
      ],
    }),

    // Comments
    getComments: builder.query<CommentNode[], string>({
      query: (requestId) => `/requests/${requestId}/comments`,
      transformResponse: (res: any) => res.data,
      providesTags: (_res, _err, id) => [{ type: 'Comment', id }],
    }),

    createComment: builder.mutation<
      CommentNode,
      { requestId: string; content: string; parentComment?: string | null }
    >({
      query: ({ requestId, ...body }) => ({
        url: `/requests/${requestId}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { requestId }) => [
        { type: 'Comment', id: requestId },
        { type: 'Request', id: requestId },
      ],
    }),

    deleteComment: builder.mutation<void, { commentId: string; requestId: string }>({
      query: ({ commentId }) => ({
        url: `/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { requestId }) => [
        { type: 'Comment', id: requestId },
      ],
    }),

    // Public Roadmap
    getRoadmap: builder.query<RoadmapColumn[], void>({
      query: () => '/roadmap',
      transformResponse: (res: any) => res.data,
      providesTags: ['Roadmap'],
    }),

    // Admin Operations
    updateStatus: builder.mutation<
      FeatureRequest,
      { id: string; status: string; roadmapOrder?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/requests/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Request', id },
        { type: 'Request', id: 'LIST' },
        'Roadmap',
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetRequestsQuery,
  useGetRequestQuery,
  useCreateRequestMutation,
  useUpdateRequestMutation,
  useDeleteRequestMutation,
  useToggleVoteMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetRoadmapQuery,
  useUpdateStatusMutation,
} = apiSlice;
