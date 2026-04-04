import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse } from '@/lib/api-utils';

export const POST = withApiHandler(async (request: NextRequest) => {
  const response = apiResponse.success(null, 'Logged out successfully');

  // Clear the auth cookie
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    expires: new Date(0), // Expire immediately
    path: '/',
  });

  return response;
});
