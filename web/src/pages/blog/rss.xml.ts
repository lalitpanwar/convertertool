import type { APIRoute } from 'astro';
import { rssResponse } from '@/lib/blog/rss';

export const GET: APIRoute = () => rssResponse('en');
