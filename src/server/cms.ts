import ClientCMS from '@vtex/client-cms'
import type { ContentData, Locator } from '@vtex/client-cms'

import config from '../../store.config'

export const clientCMS = new ClientCMS({
  workspace: config.api.workspace,
  tenant: config.api.storeId,
})

type Options =
  | Locator
  | {
      contentType: string
      filters?: Record<string, string>
    }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLocator = (x: any): x is Locator =>
  typeof x.contentType === 'string' &&
  (typeof x.releaseId === 'string' || typeof x.documentId === 'string')

/**
 * @description Fetch data section of some specific component from VTEX CMS
 * @param {string} sectionName the section name in CMS of the component
 * @return {section} section data of the component
 * @return {undefined} If section not found
 * @since 0.0.0
 * @version 0.1.0
 */
export const getSection = async <T = unknown>(
  sectionName: string
): Promise<T | undefined> => {
  try {
    const res = await fetch(`/api/getSection/${sectionName}`).then((data) =>
      data.json()
    )

    return res.data as T
  } catch {
    console.info(
      `Could not find global section for block ${sectionName}. Add a new component for this block or remove it from the CMS`
    )

    return undefined
  }
}

export const getPage = async <T extends ContentData>(options: Options) => {
  const result = await (isLocator(options)
    ? clientCMS.getCMSPage(options).then((page) => ({ data: [page] }))
    : clientCMS.getCMSPagesByContentType(options.contentType, options.filters))

  if (options.contentType === 'lp') {
    const slug = !isLocator(options) && options?.filters?.['settings.seo.slug']

    const lpPages = result.data.filter((e: any) => {
      return e?.settings?.pageSettings.slug === `/${slug}`
    })

    return lpPages[0] as T
  }

  const pages = result.data

  if (!pages[0] && options.contentType === 'plp') {
    return '' as unknown as T
  }

  if (!pages[0]) {
    throw new Error(
      `Missing content on the CMS for content type ${
        options.contentType
      }. Add content before proceeding. Context: ${JSON.stringify(
        options,
        null,
        2
      )}`
    )
  }

  if (pages.length !== 1 && options.contentType !== 'plp') {
    throw new Error(
      `Multiple content defined on the CMS for content type ${
        options.contentType
      }. Remove duplicated content before proceeding. Context: ${JSON.stringify(
        options,
        null,
        2
      )}`
    )
  }

  return pages[0] as T
}

export type PDPContentType = ContentData

export type PageContentType = ContentData & {
  settings: {
    seo: {
      slug: string
      title: string
      description: string
      canonical?: string
    }
  }
}
