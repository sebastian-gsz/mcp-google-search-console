import { z } from 'zod';
import {
  AddSiteSchema,
  DeleteSitemapSchema,
  DeleteSiteSchema,
  GetSitemapSchema,
  IndexInspectSchema,
  ListSitemapsSchema,
  SubmitSitemapSchema,
} from '../schemas.js';
import { textResult, type ToolDefinition } from './types.js';

export const listSitesTool: ToolDefinition<z.ZodObject<{}>> = {
  name: 'list_sites',
  description: 'List all sites in Google Search Console',
  schema: z.object({}),
  handler: async (_args, { service }) => textResult((await service.listSites()).data),
};

export const indexInspectTool: ToolDefinition<typeof IndexInspectSchema> = {
  name: 'index_inspect',
  description: 'Inspect a URL to see if it is indexed or can be indexed',
  schema: IndexInspectSchema,
  async handler(args, { service }) {
    const response = await service.indexInspect({
      siteUrl: args.siteUrl,
      inspectionUrl: args.inspectionUrl,
      languageCode: args.languageCode,
    });
    return textResult(response.data);
  },
};

export const listSitemapsTool: ToolDefinition<typeof ListSitemapsSchema> = {
  name: 'list_sitemaps',
  description: 'List sitemaps for a site in Google Search Console',
  schema: ListSitemapsSchema,
  async handler(args, { service }) {
    const response = await service.listSitemaps({
      siteUrl: args.siteUrl,
      sitemapIndex: args.sitemapIndex,
    });
    return textResult(response.data);
  },
};

export const getSitemapTool: ToolDefinition<typeof GetSitemapSchema> = {
  name: 'get_sitemap',
  description: 'Get a sitemap for a site in Google Search Console',
  schema: GetSitemapSchema,
  async handler(args, { service }) {
    const response = await service.getSitemap({
      siteUrl: args.siteUrl,
      feedpath: args.feedpath,
    });
    return textResult(response.data);
  },
};

export const submitSitemapTool: ToolDefinition<typeof SubmitSitemapSchema> = {
  name: 'submit_sitemap',
  description: 'Submit a sitemap for a site in Google Search Console',
  schema: SubmitSitemapSchema,
  async handler(args, { service }) {
    await service.submitSitemap({
      siteUrl: args.siteUrl,
      feedpath: args.feedpath,
    });
    return textResult({ success: true, submitted: args.feedpath, siteUrl: args.siteUrl });
  },
};

export const deleteSitemapTool: ToolDefinition<typeof DeleteSitemapSchema> = {
  name: 'delete_sitemap',
  description: 'Remove a sitemap from a site in Google Search Console',
  schema: DeleteSitemapSchema,
  async handler(args, { service }) {
    await service.deleteSitemap({
      siteUrl: args.siteUrl,
      feedpath: args.feedpath,
    });
    return textResult({ success: true, deleted: args.feedpath, siteUrl: args.siteUrl });
  },
};

export const addSiteTool: ToolDefinition<typeof AddSiteSchema> = {
  name: 'add_site',
  description: 'Add a site (property) to Google Search Console',
  schema: AddSiteSchema,
  async handler(args, { service }) {
    await service.addSite(args.siteUrl);
    return textResult({ success: true, added: args.siteUrl });
  },
};

export const deleteSiteTool: ToolDefinition<typeof DeleteSiteSchema> = {
  name: 'delete_site',
  description: 'Remove a site (property) from Google Search Console',
  schema: DeleteSiteSchema,
  async handler(args, { service }) {
    await service.deleteSite(args.siteUrl);
    return textResult({ success: true, deleted: args.siteUrl });
  },
};

export const getSiteTool: ToolDefinition<z.ZodObject<{ siteUrl: z.ZodString }>> = {
  name: 'get_site_details',
  description: 'Get details (permission level) for a site in Google Search Console',
  schema: z.object({ siteUrl: z.string().describe('The site URL, exactly as returned by list_sites') }),
  async handler(args, { service }) {
    const response = await service.getSite(args.siteUrl);
    return textResult(response.data);
  },
};
