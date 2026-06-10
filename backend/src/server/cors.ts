import { env } from '../config/env.js';

export function createCorsHeaders(requestOrigin?: string) {
  const allowedOrigin =
    requestOrigin && env.frontendOrigins.includes(requestOrigin)
      ? requestOrigin
      : env.frontendOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    Vary: 'Origin',
  };
}

export function isAllowedCorsOrigin(requestOrigin?: string) {
  return !requestOrigin || env.frontendOrigins.includes(requestOrigin);
}
