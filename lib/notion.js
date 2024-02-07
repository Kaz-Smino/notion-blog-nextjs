import { Client } from "@notionhq/client";

export const revalidate = 3600; // revalidate the data at most every hour

const databaseId = process.env.NOTION_DATABASE_ID;

// Cache object
const cache = {};

/**
 * Returns a random integer between the specified values, inclusive.
 * The value is no lower than `min`, and is less than or equal to `max`.
 *
 * @param {number} minimum - The smallest integer value that can be returned, inclusive.
 * @param {number} maximum - The largest integer value that can be returned, inclusive.
 * @returns {number} - A random integer between `min` and `max`, inclusive.
 */
function getRandomInt(minimum, maximum) {
  const min = Math.ceil(minimum);
  const max = Math.floor(maximum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const getDatabase = async () => {
  if (!cache.getDatabase) {
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    cache.getDatabase = response.results;
  }
  return cache.getDatabase;
};

export const getPage = async (pageId) => {
  if (!cache[`getPage_${pageId}`]) {
    const response = await notion.pages.retrieve({ page_id: pageId });
    cache[`getPage_${pageId}`] = response;
  }
  return cache[`getPage_${pageId}`];
};

export const getPageFromSlug = async (slug) => {
  if (!cache[`getPageFromSlug_${slug}`]) {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Slug",
        formula: {
          string: {
            equals: slug,
          },
        },
      },
    });
    if (response?.results?.length) {
      cache[`getPageFromSlug_${slug}`] = response?.results?.[0];
    } else {
      cache[`getPageFromSlug_${slug}`] = {};
    }
  }
  return cache[`getPageFromSlug_${slug}`];
};

export const getBlocks = async (blockID) => {
  const blockId = blockID.replaceAll("-", "");

  if (!cache[`getBlocks_${blockId}`]) {
    const { results } = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
    });

    // Fetches all child blocks recursively
    // be mindful of rate limits if you have large amounts of nested blocks
    // See https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
    const childBlocks = results.map(async (block) => {
      if (block.has_children) {
        const children = await getBlocks(block.id);
        return { ...block, children };
      }
      return block;
    });

    cache[`getBlocks_${blockId}`] = Promise.all(childBlocks).then((blocks) =>
      blocks.reduce((acc, curr) => {
        if (curr.type === "bulleted_list_item") {
          if (acc[acc.length - 1]?.type === "bulleted_list") {
            acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
          } else {
            acc.push({
              id: getRandomInt(10 ** 99, 10 ** 100).toString(),
              type: "bulleted_list",
              bulleted_list: { children: [curr] },
            });
          }
        } else if (curr.type === "numbered_list_item") {
          if (acc[acc.length - 1]?.type === "numbered_list") {
            acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
          } else {
            acc.push({
              id: getRandomInt(10 ** 99, 10 ** 100).toString(),
              type: "numbered_list",
              numbered_list: { children: [curr] },
            });
          }
        } else {
          acc.push(curr);
        }
        return acc;
      }, []),
    );
  }
  return cache[`getBlocks_${blockId}`];
};
